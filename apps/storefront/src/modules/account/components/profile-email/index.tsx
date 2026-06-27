"use client"

import React, { useEffect, useActionState } from "react";

import { addressLabels, accountLabels } from "@lib/i18n/es-co"
import { displayCustomerField } from "@lib/customer-display"
import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
// import { updateCustomer } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  // Email updates are not supported yet — keep the form read-only feedback honest.
  const updateCustomerEmail = (
    _currentState: Record<string, unknown>,
    _formData: FormData
  ) => {
    return {
      success: false,
      error: "El correo no se puede cambiar por ahora.",
    }
  }

  const [state, formAction] = useActionState(updateCustomerEmail, {
    error: null as string | null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form id="profile-email-form" action={formAction} className="w-full">
      <AccountInfo
        label={addressLabels.email}
        currentInfo={displayCustomerField(
          customer.email,
          accountLabels.completeEmail
        )}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label={addressLabels.email}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={customer.email ?? ""}
            data-testid="email-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
