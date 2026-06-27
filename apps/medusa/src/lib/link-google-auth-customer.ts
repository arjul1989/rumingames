import { MedusaError, Modules } from "@medusajs/framework/utils"
import { setAuthAppMetadataWorkflow } from "@medusajs/medusa/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import { linkGuestOrdersToCustomer } from "./link-guest-orders-to-customer"

type AuthContext = {
  auth_identity_id?: string
  auth_provider?: string
  actor_id?: string
  actor_type?: string
}

type LinkGoogleAuthInput = {
  authIdentityId: string
  email: string
}

type GoogleUserMetadata = {
  email?: string
  given_name?: string
  family_name?: string
  name?: string
}

function splitGoogleName(metadata?: GoogleUserMetadata | null) {
  const fullName = metadata?.name?.trim()
  if (!fullName) {
    return {
      first_name: metadata?.given_name?.trim() || undefined,
      last_name: metadata?.family_name?.trim() || undefined,
    }
  }

  const [first, ...rest] = fullName.split(/\s+/)
  return {
    first_name: metadata?.given_name?.trim() || first,
    last_name: metadata?.family_name?.trim() || rest.join(" ") || undefined,
  }
}

async function syncGoogleProfileFields(
  customerService: {
    retrieveCustomer: (id: string) => Promise<{
      first_name?: string | null
      last_name?: string | null
    }>
    updateCustomers: (
      id: string,
      data: Record<string, string>
    ) => Promise<unknown>
  },
  customerId: string,
  metadata?: GoogleUserMetadata | null
) {
  const { first_name, last_name } = splitGoogleName(metadata)
  if (!first_name && !last_name) {
    return
  }

  const customer = await customerService.retrieveCustomer(customerId)
  const updates: Record<string, string> = {}

  if (!customer.first_name?.trim() && first_name) {
    updates.first_name = first_name
  }
  if (!customer.last_name?.trim() && last_name) {
    updates.last_name = last_name
  }

  if (Object.keys(updates).length) {
    await customerService.updateCustomers(customerId, updates)
  }
}

/** Links a Google OAuth auth identity to an existing customer with the same email. */
export async function linkGoogleAuthToExistingCustomer(
  container: MedusaContainer,
  input: LinkGoogleAuthInput
): Promise<{ customerId: string }> {
  const customerService = container.resolve(Modules.CUSTOMER)
  const authService = container.resolve(Modules.AUTH)

  const normalizedEmail = input.email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Falta el correo electrónico de Google."
    )
  }

  const authIdentity = await authService.retrieveAuthIdentity(
    input.authIdentityId,
    { relations: ["provider_identities"] }
  )

  const googleProvider = authIdentity.provider_identities?.find(
    (provider) => provider.provider === "google"
  )
  if (!googleProvider) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "La sesión no proviene de Google."
    )
  }

  const emailRaw = googleProvider.user_metadata?.email
  const googleEmail =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : undefined

  if (!googleEmail || googleEmail !== normalizedEmail) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "El correo de Google no coincide con la cuenta existente."
    )
  }

  if (authIdentity.app_metadata?.customer_id) {
    const customerId = authIdentity.app_metadata.customer_id as string
    await syncGoogleProfileFields(
      customerService,
      customerId,
      googleProvider.user_metadata as GoogleUserMetadata
    )
    await linkGuestOrdersToCustomer(container, customerId, normalizedEmail)
    return { customerId }
  }

  const existingCustomers = await customerService.listCustomers({
    email: normalizedEmail,
  })

  const accountCustomer = existingCustomers.find((customer) => customer.has_account)
  if (!accountCustomer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No existe una cuenta registrada con ese correo."
    )
  }

  await setAuthAppMetadataWorkflow(container).run({
    input: {
      authIdentityId: authIdentity.id,
      actorType: "customer",
      value: accountCustomer.id,
    },
  })

  if (accountCustomer.metadata?.email_verified !== true) {
    await customerService.updateCustomers(accountCustomer.id, {
      metadata: {
        ...(accountCustomer.metadata ?? {}),
        email_verified: true,
        email_verification_token: null,
      },
    })
  }

  await syncGoogleProfileFields(
    customerService,
    accountCustomer.id,
    googleProvider.user_metadata as GoogleUserMetadata
  )

  await linkGuestOrdersToCustomer(
    container,
    accountCustomer.id,
    normalizedEmail
  )

  return { customerId: accountCustomer.id }
}

export function getRequestAuthContext(req: {
  auth_context?: AuthContext
}): AuthContext {
  return req.auth_context ?? {}
}
