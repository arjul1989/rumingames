"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "./locale-actions"
import { getClientIpAddress } from "@lib/client-ip"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode: string
  /** Optional line-item metadata, e.g. { player_id } for game top-ups. */
  metadata?: Record<string, unknown>
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
        ...(metadata ? { metadata } : {}),
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function applyGiftCard(_code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(_code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  _codeToRemove: string,
  _giftCards: unknown[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudo aplicar el código."
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const idType =
      (formData.get("payer_identification_type") as string | null)?.trim() ||
      "CC"
    const idNumber = (
      formData.get("payer_identification_number") as string | null
    )?.trim()

    if (!idNumber) {
      throw new Error(
        "El documento es obligatorio para pagos con PSE y otros medios de Mercado Pago."
      )
    }

    const existing = await retrieveCart(cartId, "metadata")
    const metadata = {
      ...((existing?.metadata ?? {}) as Record<string, unknown>),
      payer_identification_type: idType,
      payer_identification_number: idNumber,
    }

    const shippingAddress = {
      first_name: formData.get("shipping_address.first_name"),
      last_name: formData.get("shipping_address.last_name"),
      address_1: formData.get("shipping_address.address_1"),
      address_2: "",
      company: "",
      postal_code: "00000",
      city: formData.get("shipping_address.city"),
      country_code: formData.get("shipping_address.country_code"),
      province: formData.get("shipping_address.province"),
      phone: formData.get("shipping_address.phone"),
    }

    const data: Record<string, unknown> = {
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      email: formData.get("email"),
      metadata,
    }
    await updateCart(data as HttpTypes.StoreUpdateCart)
  } catch (e) {
    return e instanceof Error ? e.message : "No se pudieron guardar los datos."
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

const MP_PROVIDER_ID =
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_ID || "pp_mercadopago_mercadopago"

const MP_APPROVED_STATUSES = [
  "captured",
  "authorized",
  "partially_captured",
  "partially_authorized",
]

/**
 * Completes a cart paid with Mercado Pago.
 *
 * Supports card tokenization plus PSE / Efecty payloads from the Payment Brick.
 * Redirects to Mercado Pago (bank or voucher) when the API returns mp_redirect_url.
 */
export async function payWithMercadoPago(
  countryCode: string,
  paymentData: Record<string, unknown>
) {
  const cart = await retrieveCart(
    undefined,
    "*payment_collection, *payment_collection.payment_sessions, *region, *shipping_address, email, metadata"
  )

  if (!cart) {
    return { error: "No encontramos tu carrito." }
  }

  // Inject the Brick token (+ payment method / payer data) into the session.
  const pendingSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const ip_address = await getClientIpAddress()

  await initiatePaymentSession(cart, {
    provider_id: MP_PROVIDER_ID,
    data: {
      ...(pendingSession?.data as Record<string, unknown> | undefined),
      ...paymentData,
      session_id: pendingSession?.id,
      amount: cart.total,
      ip_address,
      payer_email: cart.email,
      shipping_address: cart.shipping_address,
      cart_metadata: cart.metadata,
    },
  } as HttpTypes.StoreInitializePaymentSession)

  const headers = {
    ...(await getAuthHeaders()),
  }

  let order: HttpTypes.StoreOrder | undefined
  let failureReason = ""

  try {
    const res = await sdk.store.cart.complete(cart.id, {}, headers)
    if (res?.type === "order") {
      order = res.order
    }
  } catch (e) {
    failureReason = e instanceof Error ? e.message : "El pago fue rechazado."
    try {
      const refreshed = await retrieveCart(
        cart.id,
        "*payment_collection, *payment_collection.payment_sessions"
      )
      const session = refreshed?.payment_collection?.payment_sessions?.find(
        (s) =>
          s.id === pendingSession?.id ||
          s.status === "error" ||
          s.status === "pending"
      )
      const mpError = (session?.data as Record<string, unknown> | undefined)
        ?.mp_error
      if (typeof mpError === "string" && mpError.trim()) {
        failureReason = mpError
      }
    } catch {
      // Keep the generic failure reason.
    }
  }

  if (order) {
    const cc =
      order.shipping_address?.country_code?.toLowerCase() || countryCode

    revalidateTag(await getCacheTag("carts"))
    revalidateTag(await getCacheTag("orders"))
    removeCartId()

    let paymentData = (order.payment_collections?.[0]?.payments?.[0]?.data ??
      {}) as Record<string, unknown>

    if (!paymentData.mp_redirect_url) {
      try {
        const { order: fullOrder } = await sdk.client.fetch<{
          order: HttpTypes.StoreOrder
        }>(`/store/orders/${order.id}`, {
          method: "GET",
          query: { fields: "*payment_collections.payments" },
          headers,
        })
        paymentData = (fullOrder.payment_collections?.[0]?.payments?.[0]?.data ??
          {}) as Record<string, unknown>
      } catch {
        // Fall through to status-based redirect.
      }
    }

    const mpRedirect = paymentData.mp_redirect_url as string | undefined
    if (mpRedirect) {
      const url = new URL(mpRedirect)
      url.searchParams.set("order_id", order.id)
      url.searchParams.set("country_code", cc)
      redirect(url.toString())
    }

    const approved = MP_APPROVED_STATUSES.includes(
      order.payment_status as string
    )
    const target = approved ? "success" : "pending"
    redirect(`/${cc}/checkout/${target}?order=${order.id}`)
  }

  redirect(
    `/${countryCode}/checkout/failure?reason=${encodeURIComponent(
      failureReason || "No se pudo procesar el pago."
    )}`
  )
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
