import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import { linkGuestOrders } from "@lib/data/link-guest-orders"
import { isCustomerEmailVerified } from "@lib/customer-verification"
import AccountLayout from "@modules/account/templates/account-layout"
import EmailVerificationPending from "@modules/account/components/email-verification-pending"

// Customer area is private — keep it out of search results (Epic 8 / US-8.1).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)
  const verified = isCustomerEmailVerified(customer)

  if (customer && verified) {
    await linkGuestOrders()
  }

  if (customer && !verified) {
    return (
      <AccountLayout customer={null}>
        <EmailVerificationPending email={customer.email ?? ""} />
      </AccountLayout>
    )
  }

  return (
    <AccountLayout customer={customer}>
      {customer && verified ? dashboard : login}
    </AccountLayout>
  )
}
