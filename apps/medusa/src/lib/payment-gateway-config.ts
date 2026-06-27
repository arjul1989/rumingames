import { MedusaContainer } from "@medusajs/framework"
import type {
  CountryPaymentGatewayAdminView,
  CountryPaymentGatewayView,
  PaymentGatewayAvailability,
  PaymentGatewayId,
} from "./payment-gateway-types"
import { PAYMENT_GATEWAYS } from "./payment-gateway-types"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"

const DEFAULT_COUNTRY = "co"

function gatewayAvailability(
  gateway: PaymentGatewayId
): PaymentGatewayAvailability {
  const isProd = process.env.NODE_ENV === "production"

  switch (gateway) {
    case "mercadopago":
      return {
        configured: Boolean(process.env.MP_ACCESS_TOKEN),
        mock: !isProd && process.env.MOCK_MP === "true",
      }
    case "wompi":
      return {
        configured: Boolean(
          process.env.WOMPI_PRIVATE_KEY && process.env.WOMPI_PUBLIC_KEY
        ),
        mock: !isProd && process.env.MOCK_WOMPI === "true",
      }
    default:
      return { configured: false, mock: false }
  }
}

function isGatewayUsable(gateway: PaymentGatewayId): boolean {
  const availability = gatewayAvailability(gateway)
  return availability.configured || availability.mock
}

function configId(countryCode: string): string {
  return countryCode.toLowerCase()
}

export async function getCountryPaymentGateway(
  container: MedusaContainer,
  countryCode = DEFAULT_COUNTRY
): Promise<CountryPaymentGatewayView> {
  const normalized = countryCode.toLowerCase()
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const existing = await supplier.listCountryPaymentGateways({
    country_code: normalized,
  })

  if (existing[0]) {
    return {
      country_code: existing[0].country_code,
      active_gateway: existing[0].active_gateway as PaymentGatewayId,
    }
  }

  const [created] = await supplier.createCountryPaymentGateways([
    {
      id: configId(normalized),
      country_code: normalized,
      active_gateway: "mercadopago",
    },
  ])

  return {
    country_code: created.country_code,
    active_gateway: created.active_gateway as PaymentGatewayId,
  }
}

export async function getCountryPaymentGatewayAdmin(
  container: MedusaContainer,
  countryCode = DEFAULT_COUNTRY
): Promise<CountryPaymentGatewayAdminView> {
  const config = await getCountryPaymentGateway(container, countryCode)
  const available_gateways = Object.fromEntries(
    PAYMENT_GATEWAYS.map((gateway) => [gateway, gatewayAvailability(gateway)])
  ) as Record<PaymentGatewayId, PaymentGatewayAvailability>

  return {
    ...config,
    available_gateways,
  }
}

export async function listCountryPaymentGatewaysAdmin(
  container: MedusaContainer
): Promise<CountryPaymentGatewayAdminView[]> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const rows = await supplier.listCountryPaymentGateways({})
  const byCountry = new Map(
    rows.map((row) => [row.country_code.toLowerCase(), row])
  )

  const countries = new Set([DEFAULT_COUNTRY, ...byCountry.keys()])
  const views: CountryPaymentGatewayAdminView[] = []

  for (const country of countries) {
    views.push(await getCountryPaymentGatewayAdmin(container, country))
  }

  return views.sort((a, b) => a.country_code.localeCompare(b.country_code))
}

export async function updateCountryPaymentGateway(
  container: MedusaContainer,
  countryCode: string,
  activeGateway: PaymentGatewayId
): Promise<CountryPaymentGatewayAdminView> {
  if (!PAYMENT_GATEWAYS.includes(activeGateway)) {
    throw new Error(`Unsupported payment gateway: ${activeGateway}`)
  }

  if (!isGatewayUsable(activeGateway)) {
    throw new Error(
      `Gateway ${activeGateway} is not configured for this environment`
    )
  }

  const normalized = countryCode.toLowerCase()
  await getCountryPaymentGateway(container, normalized)

  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  await supplier.updateCountryPaymentGateways([
    {
      id: configId(normalized),
      active_gateway: activeGateway,
    },
  ])

  return getCountryPaymentGatewayAdmin(container, normalized)
}
