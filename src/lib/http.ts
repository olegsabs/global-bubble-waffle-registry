import { NextResponse } from "next/server";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function jsonError(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details
    },
    { status }
  );
}
