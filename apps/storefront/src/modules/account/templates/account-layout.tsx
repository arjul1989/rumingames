import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 py-12" data-testid="account-page">
      <div className="content-container mx-auto flex h-full max-w-5xl flex-col">
        <div className="grid grid-cols-1 gap-8 py-4 small:grid-cols-[240px_1fr]">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-8 border-t border-white/10 py-12 small:flex-row small:items-end">
          <div>
            <h3 className="font-display mb-4 text-xl font-bold text-on-surface">
              ¿Tienes preguntas?
            </h3>
            <span className="text-on-surface-variant/70">
              Encuentra respuestas frecuentes en nuestra página de atención al
              cliente.
            </span>
          </div>
          <div>
            <UnderlineLink href="/customer-service">
              Atención al cliente
            </UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
