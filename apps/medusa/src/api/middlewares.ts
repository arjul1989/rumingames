import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

// Require an authenticated customer to reveal their own digital codes
// (US-2.4 / RUM-19).
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/orders/*/digital-codes",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
