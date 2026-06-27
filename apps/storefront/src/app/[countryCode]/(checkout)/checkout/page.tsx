import { getPaymentGatewaySettings } from "@lib/payment-gateway-settings"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function CheckoutGatewayResolver({ params }: Props) {
  const { countryCode } = await params
  const gateway = await getPaymentGatewaySettings(countryCode)

  redirect(`/${countryCode}/checkout/${gateway.active_gateway}`)
}
