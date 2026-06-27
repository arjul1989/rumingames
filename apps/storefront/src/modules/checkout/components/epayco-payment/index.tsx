"use client"

import { HttpTypes } from "@medusajs/types"
import EpaycoCardPayment from "../epayco-card-payment"

type EpaycoPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  "data-testid"?: string
}

const EpaycoPayment = ({
  cart,
  countryCode,
  "data-testid": dataTestId,
}: EpaycoPaymentProps) => {
  return (
    <div data-testid={dataTestId}>
      <EpaycoCardPayment cart={cart} countryCode={countryCode} />
    </div>
  )
}

export default EpaycoPayment
