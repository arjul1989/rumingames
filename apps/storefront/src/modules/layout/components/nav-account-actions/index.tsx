import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { accountLabels } from "@lib/i18n/es-co"

type NavAccountActionsProps = {
  customer: { first_name?: string | null; email?: string | null } | null
}

export default function NavAccountActions({ customer }: NavAccountActionsProps) {
  if (customer) {
    const label = customer.first_name?.trim() || accountLabels.account
    return (
      <LocalizedClientLink
        href="/account/orders"
        className="hidden items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary md:flex"
        data-testid="nav-account-link"
      >
        <span className="material-symbols-outlined text-xl">account_circle</span>
        <span className="max-w-[120px] truncate">{label}</span>
      </LocalizedClientLink>
    )
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <LocalizedClientLink
        href="/account"
        className="font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
        data-testid="nav-login-link"
      >
        {accountLabels.signIn}
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/account?view=register"
        className="brutalist-button bg-primary px-4 py-2 font-mono text-label-caps tracking-widest text-on-primary shadow-[0_0_16px_rgba(221,183,255,0.35)] transition-all hover:shadow-[0_0_24px_rgba(221,183,255,0.5)]"
        data-testid="nav-register-link"
      >
        {accountLabels.register}
      </LocalizedClientLink>
    </div>
  )
}
