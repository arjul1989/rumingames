import { NextRequest, NextResponse } from "next/server"

// Shared HTTP helpers for BFF route handlers: CORS, JSON responses and a
// small wrapper that applies CORS + rate limiting (US-5.1 / RUM-35).

function allowedOrigins(): string[] {
  const raw =
    process.env.BFF_ALLOWED_ORIGINS ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:8000"
  return raw.split(",").map((o) => o.trim()).filter(Boolean)
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || ""
  const allowed = allowedOrigins()
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*"
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "vary": "origin",
  }
}

export function json(
  req: NextRequest,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders(req), ...extraHeaders },
  })
}

export function error(
  req: NextRequest,
  message: string,
  status = 400,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return json(req, { error: message }, status, extraHeaders)
}

export function preflight(req: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}
