import { MedusaContainer } from "@medusajs/framework"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { getUsdCopRate, getDefaultMarginPct } from "./pricing"

const CONFIG_ID = "default"

export interface FazerConfigView {
  usd_cop_rate: number
  default_margin_pct: number
  last_full_sync_at: string | null
}

export async function getFazerConfig(
  container: MedusaContainer
): Promise<FazerConfigView> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const existing = await supplier.listFazerConfigs({ id: CONFIG_ID })
  if (existing[0]) {
    return {
      usd_cop_rate: existing[0].usd_cop_rate,
      default_margin_pct: existing[0].default_margin_pct,
      last_full_sync_at: existing[0].last_full_sync_at?.toISOString() ?? null,
    }
  }

  const [created] = await supplier.createFazerConfigs([
    {
      id: CONFIG_ID,
      usd_cop_rate: getUsdCopRate(),
      default_margin_pct: getDefaultMarginPct(),
    },
  ])
  return {
    usd_cop_rate: created.usd_cop_rate,
    default_margin_pct: created.default_margin_pct,
    last_full_sync_at: null,
  }
}

export async function updateFazerConfig(
  container: MedusaContainer,
  patch: Partial<{ usd_cop_rate: number; default_margin_pct: number }>
): Promise<FazerConfigView> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  await getFazerConfig(container)
  const [updated] = await supplier.updateFazerConfigs([
    {
      id: CONFIG_ID,
      ...patch,
    },
  ])
  return {
    usd_cop_rate: updated.usd_cop_rate,
    default_margin_pct: updated.default_margin_pct,
    last_full_sync_at: updated.last_full_sync_at?.toISOString() ?? null,
  }
}

export async function touchFazerFullSync(container: MedusaContainer): Promise<void> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  await getFazerConfig(container)
  await supplier.updateFazerConfigs([
    { id: CONFIG_ID, last_full_sync_at: new Date() },
  ])
}

export async function resolveFazerRate(container: MedusaContainer): Promise<number> {
  const config = await getFazerConfig(container)
  return config.usd_cop_rate
}
