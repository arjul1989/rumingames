import { NextRequest, NextResponse } from "next/server"
import { completeGoogleAuth, OAUTH_COUNTRY_COOKIE } from "@lib/auth/google"
import { absoluteStorefrontUrl } from "@lib/request-origin"
import { setAuthTokenOnResponse } from "@lib/data/cookies"

// GET /api/auth/google/callback — Google OAuth redirect target (RUM-69 / US-1.6).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const countryCode =
    req.cookies.get(OAUTH_COUNTRY_COOKIE)?.value ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "co"

  const query = Object.fromEntries(searchParams.entries())
  const loginUrl = absoluteStorefrontUrl(req, `/${countryCode}/account`)

  if (query.error) {
    loginUrl.searchParams.set("error", "google_denied")
    return NextResponse.redirect(loginUrl)
  }

  let token: string
  try {
    token = await completeGoogleAuth(query)
  } catch {
    loginUrl.searchParams.set("error", "google_failed")
    return NextResponse.redirect(loginUrl)
  }

  const res = NextResponse.redirect(
    absoluteStorefrontUrl(req, `/${countryCode}/account`)
  )
  setAuthTokenOnResponse(res, token)
  res.cookies.delete(OAUTH_COUNTRY_COOKIE)
  return res
}
