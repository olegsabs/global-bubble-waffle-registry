import { NextRequest, NextResponse } from "next/server";

import { createShopSubmission } from "@/domain/submissions/repository";
import { createSubmissionSchema } from "@/domain/submissions/schemas";
import { jsonError, parseJsonBody } from "@/lib/http";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await parseJsonBody(request);

    if (
      typeof payload === "object" &&
      payload !== null &&
      "company" in payload &&
      typeof payload.company === "string" &&
      payload.company.trim().length > 0
    ) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    const parsed = createSubmissionSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError("Validation failed.", 422, parsed.error.flatten());
    }

    const submission = await createShopSubmission(parsed.data);

    logger.info("Shop submission created", {
      submissionId: submission.id,
      city: parsed.data.city,
      country: parsed.data.country
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Submission received and queued for moderation.",
        id: submission.id
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("valid JSON")) {
      return jsonError(error.message, 400);
    }

    logger.error("POST /api/submissions failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    return jsonError("Unable to submit shop.", 500);
  }
}
