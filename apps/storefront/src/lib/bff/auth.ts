import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@lib/data/cookies"

// Customer session helpers for the BFF (US-5.3 / RUM-37). The Medusa customer
// JWT is stored in an httpOnly, sameSite cookie so it is never exposed to
// client-side JS, mitigating XSS token theft.

export const JWT_COOKIE = SESSION_COOKIE
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(JWT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.delete(JWT_COOKIE)
}

export function getSessionToken(req: NextRequest): string | undefined {
  return req.cookies.get(JWT_COOKIE)?.value
}
