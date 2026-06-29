type MpBrickErrorLike =
  | string
  | {
      message?: string
      type?: string
      cause?: string
    }

const MP_BRICK_ERROR_MESSAGES: Record<string, string> = {
  payment_method_not_in_allowed_types:
    "La tarjeta no coincide con el tipo de pago elegido. Usa «Tarjeta de débito» para débito o «Tarjeta de crédito» para crédito.",
  payment_method_not_in_allowed_methods:
    "Este método de pago no está habilitado. Prueba otra opción o contacta a soporte.",
  get_card_bin_payment_methods_failed:
    "No pudimos validar el número de tarjeta. Revisa los dígitos o usa una tarjeta de prueba de Mercado Pago.",
  unauthorized_payment_method:
    "Este método de pago no está habilitado en la cuenta de Mercado Pago del comercio.",
  card_token_creation_failed:
    "No se pudo procesar la tarjeta. En local, prueba con HTTPS (pnpm dev:https) y tarjetas de prueba de MP.",
  secure_fields_card_token_creation_failed:
    "No se pudo tokenizar la tarjeta de forma segura. En desarrollo local, ejecuta el storefront con HTTPS.",
  incomplete_fields: "Completa todos los campos de pago.",
  no_payment_method_for_provided_bin:
    "Número de tarjeta no reconocido. Usa una tarjeta de prueba de Mercado Pago Colombia.",
  submit_attempt_while_fetching_payment_info:
    "Espera un momento mientras validamos la tarjeta e intenta de nuevo.",
}

/** Maps Mercado Pago Payment Brick error codes to actionable Spanish copy. */
export function mapMpBrickError(error: MpBrickErrorLike): string {
  const parts = [
    typeof error === "string" ? error : error?.cause,
    typeof error === "string" ? undefined : error?.type,
    typeof error === "string" ? undefined : error?.message,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .toLowerCase()

  for (const [code, message] of Object.entries(MP_BRICK_ERROR_MESSAGES)) {
    if (parts.includes(code)) return message
  }

  if (typeof error === "object" && error?.message?.trim()) {
    return error.message
  }

  if (typeof error === "string" && error.trim()) {
    return error
  }

  return "Revisa los datos de pago e intenta de nuevo."
}

const CHECKOUT_FAILURE_MESSAGES: Record<string, string> = {
  "was not authorized with the provider":
    "El pago no se autorizó con Mercado Pago. Si estás en local, confirma que MOCK_MP=true y reinicia Medusa; tras pagar deberías ver el simulador de aprobación.",
}

/** Maps raw checkout failure reasons to user-facing Spanish copy. */
export function mapCheckoutFailureReason(reason?: string | null): string {
  if (!reason?.trim()) {
    return "Tu pago no se completó. No se realizó ningún cargo. Revisa los datos de tu tarjeta o intenta con otro método."
  }

  const lower = reason.toLowerCase()
  for (const [needle, message] of Object.entries(CHECKOUT_FAILURE_MESSAGES)) {
    if (lower.includes(needle)) return message
  }

  const brick = mapMpBrickError(reason)
  if (brick !== "Revisa los datos de pago e intenta de nuevo.") {
    return brick
  }

  return reason
}
