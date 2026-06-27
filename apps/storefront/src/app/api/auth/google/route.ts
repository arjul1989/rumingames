import { NextRequest, NextResponse } from "next/server"
import { medusaFetch } from "@lib/bff/medusa"
import { getGoogleCallbackUrl, OAUTH_COUNTRY_COOKIE } from "@lib/auth/google"
import { absoluteStorefrontUrl } from "@lib/request-origin"

// GET /api/auth/google — start Google OAuth (RUM-69 / US-1.6).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const countryCode =
    searchParams.get("countryCode") ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "co"

  const auth = await medusaFetch<{ location?: string; token?: string }>(
    "/auth/customer/google",
    {
      method: "POST",
      body: { callback_url: getGoogleCallbackUrl() },
    }
  )

  if (!auth.ok) {
    const loginUrl = absoluteStorefrontUrl(req, `/${countryCode}/account`)
    loginUrl.searchParams.set("error", "google_unavailable")
    return NextResponse.redirect(loginUrl)
  }

  if (auth.data?.location) {
    const res = NextResponse.redirect(auth.data.location)
    res.cookies.set(OAUTH_COUNTRY_COOKIE, countryCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    })
    return res
  }

  return NextResponse.redirect(
    absoluteStorefrontUrl(req, `/${countryCode}/account`)
  )
}
