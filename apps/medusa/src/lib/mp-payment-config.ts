import { MedusaContainer } from "@medusajs/framework"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"

const CONFIG_ID = "default"

export interface MpPaymentConfigView {
  enable_cards: boolean
  enable_pse: boolean
  enable_efecty: boolean
  enable_manual_test: boolean
}

export async function getMpPaymentConfig(
  container: MedusaContainer
): Promise<MpPaymentConfigView> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const existing = await supplier.listMpPaymentConfigs({ id: CONFIG_ID })
  if (existing[0]) {
    return {
      enable_cards: existing[0].enable_cards,
      enable_pse: existing[0].enable_pse,
      enable_efecty: existing[0].enable_efecty,
      enable_manual_test: existing[0].enable_manual_test,
    }
  }

  const manualDefault = !process.env.MP_ACCESS_TOKEN
  const [created] = await supplier.createMpPaymentConfigs([
    {
      id: CONFIG_ID,
      enable_cards: true,
      enable_pse: true,
      enable_efecty: true,
      enable_manual_test: manualDefault,
    },
  ])
  return {
    enable_cards: created.enable_cards,
    enable_pse: created.enable_pse,
    enable_efecty: created.enable_efecty,
    enable_manual_test: created.enable_manual_test,
  }
}

export async function updateMpPaymentConfig(
  container: MedusaContainer,
  patch: Partial<MpPaymentConfigView>
): Promise<MpPaymentConfigView> {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  await getMpPaymentConfig(container)
  const [updated] = await supplier.updateMpPaymentConfigs([
    { id: CONFIG_ID, ...patch },
  ])
  return {
    enable_cards: updated.enable_cards,
    enable_pse: updated.enable_pse,
    enable_efecty: updated.enable_efecty,
    enable_manual_test: updated.enable_manual_test,
  }
}
