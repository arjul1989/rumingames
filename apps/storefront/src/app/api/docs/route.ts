// GET /api/docs — Swagger UI for the BFF OpenAPI spec (US-5.4 / RUM-38).
// Renders Swagger UI from CDN, loading the spec from /api/openapi.json.
export function GET() {
  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Gorumin API — Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; } .topbar { display: none; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
        })
      }
    </script>
  </body>
</html>`
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}
