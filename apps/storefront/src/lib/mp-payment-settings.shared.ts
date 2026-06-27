export interface MpPaymentSettings {
  configured: boolean
  enable_cards: boolean
  enable_pse: boolean
  enable_efecty: boolean
  enable_manual_test: boolean
}

export const MP_PAYMENT_SETTINGS_DEFAULTS: MpPaymentSettings = {
  configured: false,
  enable_cards: true,
  enable_pse: true,
  enable_efecty: true,
  enable_manual_test: true,
}

export function mpMethodsEnabled(settings: MpPaymentSettings): boolean {
  return (
    settings.enable_cards || settings.enable_pse || settings.enable_efecty
  )
}

export function buildMpBrickPaymentMethods(
  settings: MpPaymentSettings
): Record<string, unknown> {
  const methods: Record<string, unknown> = { maxInstallments: 36 }
  if (settings.enable_cards) {
    methods.creditCard = "all"
    methods.debitCard = "all"
  }
  if (settings.enable_pse) {
    methods.bankTransfer = "all"
  }
  if (settings.enable_efecty) {
    methods.ticket = ["efecty"]
  }
  return methods
}

export function filterCheckoutPaymentMethods(
  methods: { id: string }[],
  settings: MpPaymentSettings
): { id: string }[] {
  return methods.filter((m) => {
    if (m.id.startsWith("pp_system_default") && !settings.enable_manual_test) {
      return false
    }
    if (m.id.startsWith("pp_mercadopago")) {
      if (!settings.configured || !mpMethodsEnabled(settings)) {
        return false
      }
    }
    return true
  })
}
