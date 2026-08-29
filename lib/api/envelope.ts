import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const body = meta != null ? { data, meta } : { data };
  return NextResponse.json(body, { status });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  data?: unknown,
) {
  const body: {
    error: ApiErrorBody;
    data?: unknown;
  } = {
    error: { code, message, ...(details ? { details } : {}) },
  };
  if (data !== undefined) {
    body.data = data;
  }
  return NextResponse.json(body, { status });
}
