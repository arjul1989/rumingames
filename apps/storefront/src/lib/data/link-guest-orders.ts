"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { revalidateTag } from "next/cache"

/** Attach guest-checkout orders with the same email to the logged-in account. */
export async function linkGuestOrders(): Promise<void> {
  const headers = await getAuthHeaders()
  if (!headers.authorization) return

  try {
    await sdk.client.fetch("/store/customers/me/link-orders", {
      method: "POST",
      headers,
      body: {},
    })
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)
  } catch {
    // Best-effort — orders page may still be empty until next login.
  }
}
