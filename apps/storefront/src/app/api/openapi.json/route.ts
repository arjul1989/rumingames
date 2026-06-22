import { NextRequest } from "next/server"
import { json } from "@lib/bff/http"
import { options } from "@lib/bff/handler"
import { openapiSpec } from "@lib/bff/openapi"

export const OPTIONS = options

// GET /api/openapi.json — machine-readable OpenAPI 3.0 spec (US-5.4 / RUM-38).
export function GET(req: NextRequest) {
  return json(req, openapiSpec)
}
