import { MedusaContainer } from "@medusajs/framework"
import { sendEmail } from "./email/send-email"
import { storefrontUrl } from "./storefront-url"

export type DigitalCodeEmailEntry = {
  product: string
  code: string
}

export async function sendDigitalCodesEmail(
  container: MedusaContainer,
  params: {
    to: string
    display_id: number | string
    order_id: string
    codes: DigitalCodeEmailEntry[]
    country_code?: string
  }
) {
  if (!params.to || !params.codes.length) return

  const cc = params.country_code?.toLowerCase() ?? "co"
  const ordersUrl = storefrontUrl(
    `/account/orders/details/${params.order_id}`,
    cc
  )

  const primary = params.codes[0]
  await sendEmail(container, {
    to: params.to,
    template: "digital-code-delivered",
    order_id: params.order_id,
    data: {
      product: primary.product,
      display_id: params.display_id,
      code: primary.code,
      codes: params.codes,
      orders_url: ordersUrl,
      account_url: storefrontUrl("/account", cc),
    },
  })
}
