import { NextResponse } from "next/server";

import { RateLimitError } from "@/lib/api/rate-limit";

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function readJsonObject(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  const value: unknown = await request.json().catch(() => null);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiRequestError("Request body must be a JSON object");
  }

  return value as Record<string, unknown>;
}

export function getOptionalInteger(
  body: Record<string, unknown>,
  key: string,
) {
  const value = body[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Number.isInteger(value)) {
    throw new ApiRequestError(`${key} must be an integer`);
  }

  return value as number;
}

export function getRequiredInteger(
  body: Record<string, unknown>,
  key: string,
) {
  const value = getOptionalInteger(body, key);

  if (value === undefined) {
    throw new ApiRequestError(`${key} is required`);
  }

  return value;
}

export function jsonBadRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function apiRequestErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 429,
        headers: {
          "Retry-After": String(error.retryAfterSeconds),
        },
      },
    );
  }

  if (error instanceof ApiRequestError) {
    return jsonBadRequest(error.message);
  }

  return null;
}
