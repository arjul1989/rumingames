import React from "react"

// Renders a schema.org JSON-LD block (Epic 8 / US-8.3 / RUM-55). Server
// component: the structured data is emitted in the initial HTML so crawlers
// pick it up without executing JS.
export default function JsonLd({
  data,
  id,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
  id?: string
}) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // Structured data is trusted, server-built content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
