import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    // Require an authenticated customer to reveal their own digital codes
    // (US-2.4 / RUM-19).
    {
      matcher: "/store/orders/*/digital-codes",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    // Preserve the raw body so we can verify the Mercado Pago webhook
    // signature (US-3.3 / RUM-25). Public route (no auth).
    {
      matcher: "/hooks/mercadopago",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
    // Preserve the raw body to verify the Fazer webhook HMAC signature
    // (US-2.5 / RUM-20). Public route (no auth).
    {
      matcher: "/hooks/fazer",
      method: ["POST"],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
