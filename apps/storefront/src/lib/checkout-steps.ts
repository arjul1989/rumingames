const CHECKOUT_STEPS = ["address", "delivery", "payment", "review"] as const

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

export function checkoutStepIndex(step: string | null | undefined): number {
  if (!step) return 0
  const index = CHECKOUT_STEPS.indexOf(step as CheckoutStep)
  return index >= 0 ? index : 0
}

/** Section stays open once the shopper reaches that step (and remains open afterward). */
export function isCheckoutStepOpen(
  sectionStep: CheckoutStep,
  currentStep: string | null
): boolean {
  return checkoutStepIndex(currentStep) >= checkoutStepIndex(sectionStep)
}
