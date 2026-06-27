import { model } from "@medusajs/framework/utils"

/** Per-country FX, currency and tax rules for USD-based retail pricing. */
const CountryPricingConfig = model.define("country_pricing_config", {
  id: model.id().primaryKey(),
  country_code: model.text(),
  fx_rate: model.float().default(4000),
  local_currency_code: model.text().default("cop"),
  taxes: model.json().default([]),
})

export default CountryPricingConfig
