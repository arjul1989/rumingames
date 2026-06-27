"use client"
import { setAddresses } from "@lib/data/cart"
import { checkoutLabels } from "@lib/i18n/es-co"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          {checkoutLabels.shippingAddress}
          {!isOpen && <CheckCircleSolid />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-address-button"
            >
              {checkoutLabels.edit}
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-8">
            <ShippingAddress customer={customer} cart={cart} />
            <SubmitButton
              tone="checkout"
              className="mt-6"
              data-testid="submit-address-button"
            >
              {checkoutLabels.continueToDelivery}
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div
                className="flex flex-col gap-2"
                data-testid="shipping-address-summary"
              >
                <Text className="txt-medium text-on-surface">
                  {cart.shipping_address.first_name}{" "}
                  {cart.shipping_address.last_name}
                </Text>
                <Text className="txt-medium text-on-surface-variant/80">
                  {cart.email}
                  {cart.shipping_address.phone
                    ? ` · ${cart.shipping_address.phone}`
                    : ""}
                </Text>
                {(() => {
                  const meta = (cart.metadata ?? {}) as Record<string, unknown>
                  const docType = meta.payer_identification_type as
                    | string
                    | undefined
                  const docNumber = meta.payer_identification_number as
                    | string
                    | undefined
                  if (!docNumber) return null
                  return (
                    <Text className="txt-medium text-on-surface-variant/80">
                      {docType ?? "CC"} {docNumber}
                    </Text>
                  )
                })()}
                <Text className="txt-medium text-on-surface-variant/80">
                  {cart.shipping_address.address_1}
                  {cart.shipping_address.city
                    ? `, ${cart.shipping_address.city}`
                    : ""}
                  {cart.shipping_address.province
                    ? `, ${cart.shipping_address.province}`
                    : ""}
                </Text>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
