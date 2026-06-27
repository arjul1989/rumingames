import { Metadata } from "next"

import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { accountLabels } from "@lib/i18n/es-co"

export const metadata: Metadata = {
  title: "Mis datos",
  description: accountLabels.profileDesc,
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          {accountLabels.myData}
        </h1>
        <p className="text-base-regular text-on-surface-variant/70">
          {accountLabels.profileDesc}
        </p>
      </div>
      <div className="hyper-glass flex flex-col gap-y-8 rounded-2xl p-6 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => <div className="w-full h-px bg-white/10" />
