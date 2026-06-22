// OpenAPI 3.0 spec for the Gorumin BFF custom endpoints (US-5.4 / RUM-38).
// Served as JSON at /api/openapi.json and rendered with Swagger UI at /api/docs.

const ok = (description: string) => ({
  description,
  content: { "application/json": { schema: { type: "object" } } },
})

const errorResponse = {
  description: "Error",
  content: {
    "application/json": {
      schema: { type: "object", properties: { error: { type: "string" } } },
    },
  },
}

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Gorumin BFF API",
    version: "1.0.0",
    description:
      "Backend-for-frontend del storefront de Gorumin. Proxy tipado hacia Medusa con CORS, rate limiting y sesión de cliente en cookie httpOnly.",
  },
  servers: [
    { url: "http://localhost:8000/api", description: "Local" },
    { url: "https://gorumin.com/api", description: "Producción" },
  ],
  tags: [
    { name: "catalog", description: "Productos y categorías" },
    { name: "content", description: "Noticias, streamers y feed de comunidad" },
    { name: "cart", description: "Carrito y checkout" },
    { name: "auth", description: "Sesión de cliente (JWT en cookie httpOnly)" },
    { name: "orders", description: "Órdenes, estado de pago y códigos digitales" },
  ],
  components: {
    parameters: {
      limit: { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
      offset: { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
      region: {
        name: "region",
        in: "query",
        description: "Código ISO2 del país (default: co)",
        schema: { type: "string", default: "co" },
      },
    },
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "_gorumin_jwt" },
    },
  },
  paths: {
    "/products": {
      get: {
        tags: ["catalog"],
        summary: "Listar productos (precios en COP)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category_id", in: "query", schema: { type: "string" } },
          { $ref: "#/components/parameters/region" },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: { "200": ok("Lista de productos"), "502": errorResponse },
      },
    },
    "/products/{handle}": {
      get: {
        tags: ["catalog"],
        summary: "Detalle de producto por handle",
        parameters: [
          { name: "handle", in: "path", required: true, schema: { type: "string" } },
          { $ref: "#/components/parameters/region" },
        ],
        responses: { "200": ok("Producto"), "404": errorResponse },
      },
    },
    "/categories": {
      get: {
        tags: ["catalog"],
        summary: "Listar categorías de productos",
        parameters: [
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: { "200": ok("Categorías") },
      },
    },
    "/articles": {
      get: {
        tags: ["content"],
        summary: "Listar noticias publicadas",
        parameters: [
          { name: "category_id", in: "query", schema: { type: "string" } },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: { "200": ok("Artículos") },
      },
    },
    "/articles/{slug}": {
      get: {
        tags: ["content"],
        summary: "Detalle de noticia (con productos relacionados)",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": ok("Artículo"), "404": errorResponse },
      },
    },
    "/streamers": {
      get: {
        tags: ["content"],
        summary: "Listar streamers",
        parameters: [
          { name: "featured", in: "query", schema: { type: "boolean" } },
          { $ref: "#/components/parameters/limit" },
        ],
        responses: { "200": ok("Streamers") },
      },
    },
    "/feed": {
      get: {
        tags: ["content"],
        summary: "Feed unificado (noticias + productos + streamers)",
        parameters: [
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: { "200": ok("Feed") },
      },
    },
    "/cart": {
      get: {
        tags: ["cart"],
        summary: "Obtener carrito actual (cookie o ?id=)",
        responses: { "200": ok("Carrito") },
      },
      post: {
        tags: ["cart"],
        summary: "Crear carrito",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  email: { type: "string" },
                  items: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: { "201": ok("Carrito creado") },
      },
    },
    "/cart/{id}": {
      post: {
        tags: ["cart"],
        summary: "Actualizar carrito (email, direcciones, etc.)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": ok("Carrito actualizado") },
      },
    },
    "/cart/{id}/line-items": {
      post: {
        tags: ["cart"],
        summary: "Agregar línea al carrito",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["variant_id"],
                properties: {
                  variant_id: { type: "string" },
                  quantity: { type: "integer", default: 1 },
                },
              },
            },
          },
        },
        responses: { "200": ok("Carrito"), "422": errorResponse },
      },
    },
    "/cart/{id}/line-items/{line}": {
      post: {
        tags: ["cart"],
        summary: "Actualizar cantidad de una línea",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "line", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": ok("Carrito") },
      },
      delete: {
        tags: ["cart"],
        summary: "Eliminar una línea",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "line", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": ok("Carrito") },
      },
    },
    "/checkout/payment-session": {
      post: {
        tags: ["cart"],
        summary: "Iniciar sesión de pago (Mercado Pago)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cart_id"],
                properties: {
                  cart_id: { type: "string" },
                  provider_id: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": ok("Payment collection con sesión"), "422": errorResponse },
      },
    },
    "/checkout/complete": {
      post: {
        tags: ["cart"],
        summary: "Completar carrito y crear orden",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { cart_id: { type: "string" } } },
            },
          },
        },
        responses: { "200": ok("Orden o carrito"), "422": errorResponse },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Login email/password (set cookie httpOnly)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: { email: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": ok("Cliente"), "401": errorResponse },
      },
    },
    "/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Registro de cliente",
        responses: { "201": ok("Cliente creado"), "400": errorResponse },
      },
    },
    "/auth/logout": {
      post: { tags: ["auth"], summary: "Cerrar sesión", responses: { "200": ok("OK") } },
    },
    "/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Cliente actual",
        security: [{ cookieAuth: [] }],
        responses: { "200": ok("Cliente o null") },
      },
    },
    "/orders/{id}/payment-status": {
      get: {
        tags: ["orders"],
        summary: "Estado de pago normalizado (polling)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": ok("pending|approved|rejected|refunded") },
      },
    },
    "/orders/{id}/digital-codes": {
      get: {
        tags: ["orders"],
        summary: "Revelar códigos digitales (requiere auth + ownership)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": ok("Códigos"), "401": errorResponse },
      },
    },
  },
} as const
