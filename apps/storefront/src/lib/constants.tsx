import { paymentMethodLabels } from "@lib/i18n/es-co"
import { CreditCard } from "@medusajs/icons"
import Bancontact from "@modules/common/icons/bancontact"
import Ideal from "@modules/common/icons/ideal"
import PayPal from "@modules/common/icons/paypal"
import React from "react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: paymentMethodLabels.pp_stripe_stripe,
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: paymentMethodLabels.pp_stripe_stripe,
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: paymentMethodLabels["pp_stripe-ideal_stripe"],
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: paymentMethodLabels["pp_stripe-bancontact_stripe"],
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: paymentMethodLabels.pp_paypal_paypal,
    icon: <PayPal />,
  },
  pp_system_default: {
    title: paymentMethodLabels.pp_system_default,
    icon: <CreditCard />,
  },
  pp_mercadopago_mercadopago: {
    title: "Mercado Pago (tarjeta, PSE, Efecty)",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
// Mercado Pago (Colombia) — card payments via the Checkout Brick (US-3.2 / RUM-24).
export const isMercadoPago = (providerId?: string) => {
  return providerId?.startsWith("pp_mercadopago")
}
export const MERCADOPAGO_PROVIDER_ID =
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_ID || "pp_mercadopago_mercadopago"

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
