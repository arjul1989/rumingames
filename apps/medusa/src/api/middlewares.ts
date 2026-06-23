import { defineMiddlewares, authenticate } from "@medusajs/framework/http"
import { requireGoruminPermission } from "../lib/admin-role-middleware"

const cms = requireGoruminPermission("cms")
const fazer = requireGoruminPermission("fazer")
const refunds = requireGoruminPermission("refunds")
const deliveries = requireGoruminPermission("deliveries")
const supplier = requireGoruminPermission("supplier")

export default defineMiddlewares({
  routes: [
    // Gorumin admin RBAC (US-9.3 / RUM-63) on custom admin routes.
    { matcher: "/admin/cms/articles", middlewares: [cms] },
    { matcher: "/admin/cms/articles/*", middlewares: [cms] },
    { matcher: "/admin/cms/categories", middlewares: [cms] },
    { matcher: "/admin/cms/streamers", middlewares: [cms] },
    { matcher: "/admin/cms/streamers/*", middlewares: [cms] },
    { matcher: "/admin/cms/tags", middlewares: [cms] },
    { matcher: "/admin/fazer/balance", middlewares: [fazer] },
    { matcher: "/admin/fazer/sync-catalog", middlewares: [fazer] },
    { matcher: "/admin/supplier/mappings", middlewares: [supplier] },
    { matcher: "/admin/supplier/mappings/*", middlewares: [supplier] },
    {
      matcher: "/admin/orders/*/refund-mp",
      method: ["POST"],
      middlewares: [refunds],
    },
    {
      matcher: "/admin/orders/*/retry-fulfillment",
      method: ["POST"],
      middlewares: [deliveries],
    },
    {
      matcher: "/admin/digital-delivery",
      method: ["GET"],
      middlewares: [deliveries],
    },
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
