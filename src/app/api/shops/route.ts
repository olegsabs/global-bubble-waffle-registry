import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createShop, listShops } from "@/domain/shops/repository";
import { createShopSchema, parseShopListQuery } from "@/domain/shops/schemas";
import { requireAdmin } from "@/lib/api/admin-auth";
import { jsonError, parseJsonBody } from "@/lib/http";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = parseShopListQuery(request.nextUrl.searchParams);
    const result = await listShops(query);

    return NextResponse.json({
      data: result.shops,
      total: result.total,
      limit: query.limit,
      offset: query.offset
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid query parameters.", 400, error.flatten());
    }

    logger.error("GET /api/shops failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to fetch shops.", 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return jsonError(admin.error, admin.status);
  }

  try {
    const payload = await parseJsonBody(request);
    const parsed = createShopSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Validation failed.", 422, parsed.error.flatten());
    }

    const created = await createShop(parsed.data);

    logger.info("Shop created", {
      id: created.id,
      slug: created.slug,
      actor: admin.actor,
      userId: admin.userId
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("valid JSON")) {
      return jsonError(error.message, 400);
    }

    logger.error("POST /api/shops failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to create shop.", 500);
  }
}
