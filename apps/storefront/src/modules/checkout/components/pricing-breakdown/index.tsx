import type { CartPricingBreakdown } from "@gorumin/types"
import { convertToLocale } from "@lib/util/money"
import { cartLabels } from "@lib/i18n/es-co"
import { clx } from "@modules/common/components/ui"

type Props = {
  breakdown: CartPricingBreakdown
}

const fmtUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

export default function CheckoutPricingBreakdown({ breakdown }: Props) {
  const { local_currency_code: currency } = breakdown

  return (
    <div className="mb-6 space-y-4" data-testid="checkout-pricing-breakdown">
      <div className="rounded-xl border border-ui-border-interactive bg-ui-bg-subtle p-4">
        <p className="txt-compact-xsmall-plus uppercase tracking-widest text-ui-fg-subtle">
          Precio en USD
        </p>
        <p className="txt-xlarge-plus text-ui-fg-base">
          {fmtUsd(breakdown.face_value_usd)}
        </p>
        <p className="txt-compact-small mt-1 text-ui-fg-subtle">
          Tasa {breakdown.fx_rate.toLocaleString("es-CO")} {currency.toUpperCase()} / USD
        </p>
      </div>

      <div className="space-y-2 txt-medium text-ui-fg-subtle">
        <div className="flex items-center justify-between">
          <span>{cartLabels.pricingFaceValueLocal}</span>
          <span>
            {convertToLocale({
              amount: breakdown.face_value_local,
              currency_code: currency,
              locale: "es-CO",
            })}
          </span>
        </div>

        {breakdown.margin_local > 0 && (
          <div className="flex items-center justify-between">
            <span>
              {cartLabels.pricingMargin}
              {breakdown.margin_pct > 0 && (
                <span className="ml-1 txt-compact-small">({breakdown.margin_pct}%)</span>
              )}
            </span>
            <span>
              {convertToLocale({
                amount: breakdown.margin_local,
                currency_code: currency,
                locale: "es-CO",
              })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>{cartLabels.pricingSubtotalLocal}</span>
          <span>
            {convertToLocale({
              amount: breakdown.subtotal_local,
              currency_code: currency,
              locale: "es-CO",
            })}
          </span>
        </div>

        {breakdown.taxes.map((tax) => (
          <div key={tax.name} className="flex items-center justify-between">
            <span>
              {tax.name} ({tax.rate_pct}%)
            </span>
            <span>
              {convertToLocale({
                amount: tax.amount_local,
                currency_code: currency,
                locale: "es-CO",
              })}
            </span>
          </div>
        ))}

        <div
          className={clx("flex items-center justify-between rounded-lg px-3 py-2", {
            "border border-emerald-500/40 bg-emerald-500/10": breakdown.commission_is_zero,
            "border border-ui-border-base": !breakdown.commission_is_zero,
          })}
        >
          <span>
            {cartLabels.pricingCommission}
            {!breakdown.commission_is_zero && (
              <span className="ml-1 txt-compact-small">
                ({breakdown.commission_pct}% +{" "}
                {convertToLocale({
                  amount: breakdown.commission_fixed_local,
                  currency_code: currency,
                  locale: "es-CO",
                })}
                )
              </span>
            )}
          </span>
          <span
            className={clx({
              "font-semibold text-emerald-600": breakdown.commission_is_zero,
            })}
          >
            {convertToLocale({
              amount: breakdown.commission_local,
              currency_code: currency,
              locale: "es-CO",
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-ui-border-base pt-3 txt-medium text-ui-fg-base">
        <span>{cartLabels.total}</span>
        <div className="text-right">
          <div className="txt-xlarge-plus">
            {convertToLocale({
              amount: breakdown.total_local,
              currency_code: currency,
              locale: "es-CO",
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
