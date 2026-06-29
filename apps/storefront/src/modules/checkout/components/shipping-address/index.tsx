import { addressLabels } from "@lib/i18n/es-co"
import {
  digitsOnly,
  formatCoIdentification,
  formatCoPhone,
} from "@lib/util/co-locale-input"
import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const DOCUMENT_TYPES = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PAS", label: "Pasaporte" },
] as const

const ShippingAddress = ({
  customer,
  cart,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
}) => {
  const meta = (cart?.metadata ?? {}) as Record<string, unknown>

  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": formatCoPhone(
      cart?.shipping_address?.phone || ""
    ),
    email: cart?.email || "",
    payer_identification_type:
      (meta.payer_identification_type as string) || "CC",
    payer_identification_number: formatCoIdentification(
      (meta.payer_identification_number as string) || "",
      (meta.payer_identification_type as string) || "CC"
    ),
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      (customer?.addresses ?? []).filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": formatCoPhone(address?.phone || ""),
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    if (name === "shipping_address.phone") {
      setFormData({
        ...formData,
        [name]: formatCoPhone(value),
      })
      return
    }

    if (name === "payer_identification_number") {
      setFormData({
        ...formData,
        [name]: formatCoIdentification(
          value,
          formData.payer_identification_type
        ),
      })
      return
    }

    if (name === "payer_identification_type") {
      setFormData({
        ...formData,
        payer_identification_type: value,
        payer_identification_number: formatCoIdentification(
          formData.payer_identification_number,
          value
        ),
      })
      return
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <div className="hyper-glass mb-6 flex flex-col gap-y-4 rounded-xl border border-white/10 p-5">
          <p className="text-small-regular text-on-surface-variant">
            {addressLabels.savedAddressPrompt(customer.first_name ?? "")}
          </p>
          <AddressSelect
            addresses={addressesInRegion ?? []}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
        <Input
          label={addressLabels.firstName}
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label={addressLabels.lastName}
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label={addressLabels.email}
          name="email"
          type="email"
          title={addressLabels.validEmail}
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label={addressLabels.phone}
          name="shipping_address.phone"
          autoComplete="tel"
          inputMode="numeric"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />
        <NativeSelect
          label={addressLabels.documentType}
          name="payer_identification_type"
          value={formData.payer_identification_type}
          onChange={handleChange}
          required
          data-testid="shipping-document-type-select"
        >
          {DOCUMENT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Input
          label={addressLabels.documentNumber}
          name="payer_identification_number"
          autoComplete="off"
          inputMode="numeric"
          value={formData.payer_identification_number}
          onChange={handleChange}
          required
          data-testid="shipping-document-number-input"
        />
        <Input
          label={addressLabels.address}
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          className="small:col-span-2"
          data-testid="shipping-address-input"
        />
        <Input
          label={addressLabels.city}
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
        <Input
          label={addressLabels.province}
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          required
          data-testid="shipping-province-input"
        />
        <CountrySelect
          label={addressLabels.country}
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
      </div>
    </>
  )
}

export default ShippingAddress
