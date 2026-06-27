import { redirect } from "next/navigation"

export default async function AccountIndexRedirect({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  redirect(`/${countryCode}/account/orders`)
}
