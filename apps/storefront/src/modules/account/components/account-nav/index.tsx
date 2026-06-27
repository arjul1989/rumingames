"use client"

import { ArrowRightOnRectangle } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { accountLabels } from "@lib/i18n/es-co"
import { displayCustomerGreeting } from "@lib/customer-display"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import CreditCard from "@modules/common/icons/credit-card"
import Package from "@modules/common/icons/package"
import User from "@modules/common/icons/user"

const NAV_ITEMS = [
  { href: "/account/profile", label: accountLabels.myData, icon: User },
  { href: "/account/orders", label: accountLabels.myPurchases, icon: Package },
  {
    href: "/account/payment-methods",
    label: accountLabels.paymentMethods,
    icon: CreditCard,
  },
] as const

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const accountRoot = `/${countryCode}/account`

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== accountRoot ? (
          <LocalizedClientLink
            href="/account/orders"
            className="flex items-center gap-x-2 py-2 text-small-regular"
            data-testid="account-main-link"
          >
            <ChevronDown className="rotate-90 transform" />
            <span>{accountLabels.account}</span>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8">
              {displayCustomerGreeting(customer?.first_name)}
            </div>
            <ul className="text-base-regular">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <LocalizedClientLink
                    href={href}
                    className="flex items-center justify-between border-b border-white/10 px-8 py-4"
                    data-testid={`${href.split("/").pop()}-link`}
                  >
                    <div className="flex items-center gap-x-2">
                      <Icon size={20} />
                      <span>{label}</span>
                    </div>
                    <ChevronDown className="-rotate-90 transform" />
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="flex w-full items-center justify-between border-b border-white/10 px-8 py-4"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  <div className="flex items-center gap-x-2">
                    <ArrowRightOnRectangle />
                    <span>{accountLabels.signOut}</span>
                  </div>
                  <ChevronDown className="-rotate-90 transform" />
                </button>
              </li>
            </ul>
          </>
        )}
      </div>

      <div className="hidden small:block" data-testid="account-nav">
        <div className="pb-4">
          <h3 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            {accountLabels.account}
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant/70">
            {displayCustomerGreeting(customer?.first_name)}
          </p>
        </div>
        <ul className="mb-0 flex flex-col items-start justify-start gap-y-3">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <AccountNavLink href={href} route={route!} data-testid={`${href.split("/").pop()}-link`}>
                {label}
              </AccountNavLink>
            </li>
          ))}
          <li className="mt-4 border-t border-white/10 pt-4">
            <button
              type="button"
              className="text-on-surface-variant/70 transition-colors hover:text-error"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              {accountLabels.signOut}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()
  const active = route.split(countryCode)[1] === href

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "block w-full rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/15 font-semibold text-primary"
          : "text-on-surface-variant/70 hover:bg-white/5 hover:text-on-surface"
      )}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
