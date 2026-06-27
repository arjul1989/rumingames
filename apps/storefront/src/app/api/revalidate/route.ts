import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

type RevalidateBody = {
  paths?: string[]
}

// On-demand ISR purge after Medusa / Fazer catalog sync.
// POST /api/revalidate?secret=...  { "paths": ["/co/store", "/co/products/steam-gift-card"] }
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  const expected = process.env.REVALIDATE_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  }

  let body: RevalidateBody = {}
  try {
    body = (await req.json()) as RevalidateBody
  } catch {
    body = {}
  }

  const paths = body.paths?.length
    ? body.paths
    : ["/co/store", "/co/products"]

  for (const path of paths) {
    revalidatePath(path)
  }
  revalidateTag("catalog-products")

  return NextResponse.json({ ok: true, revalidated: paths })
}
