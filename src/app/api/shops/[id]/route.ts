import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { updateShop } from "@/domain/shops/repository";
import { updateShopSchema } from "@/domain/shops/schemas";
import { requireAdmin } from "@/lib/api/admin-auth";
import { jsonError, parseJsonBody } from "@/lib/http";
import { logger } from "@/lib/logger";

const paramsSchema = z.object({
  id: z.string().uuid()
});

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return jsonError(admin.error, admin.status);
  }

  try {
    const params = paramsSchema.parse(await context.params);
    const payload = await parseJsonBody(request);
    const parsed = updateShopSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Validation failed.", 422, parsed.error.flatten());
    }

    const updated = await updateShop(params.id, parsed.data);

    if (!updated) {
      return jsonError("Shop not found.", 404);
    }

    logger.info("Shop updated", {
      id: params.id,
      actor: admin.actor,
      userId: admin.userId
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid shop id.", 400, error.flatten());
    }

    if (error instanceof Error && error.message.includes("valid JSON")) {
      return jsonError(error.message, 400);
    }

    logger.error("PATCH /api/shops/:id failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to update shop.", 500);
  }
}
