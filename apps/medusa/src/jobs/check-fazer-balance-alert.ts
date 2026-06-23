import { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { FAZER_MODULE } from "../modules/fazer"
import type FazerModuleService from "../modules/fazer/service"
import { emitMonitorAlert } from "../lib/monitoring"

const DEFAULT_THRESHOLD = 50
const DEDUPE_SECONDS = 60 * 60 * 6

// Scheduled Fazer balance guard (US-10.3 / RUM-67). Emits a structured monitor
// event (and optional email) when the wallet drops below threshold.
export default async function checkFazerBalanceAlertJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  if (!process.env.FAZER_API_KEY) return

  const threshold = Number(process.env.FAZER_BALANCE_ALERT_THRESHOLD) || DEFAULT_THRESHOLD

  try {
    const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
    const balance = await fazer.getBalance()
    if (balance.balance_usd >= threshold) return

    const cache = container.resolve(Modules.CACHE)
    const dedupeKey = "monitor:fazer:balance:low"
    if (await cache.get(dedupeKey)) return
    await cache.set(dedupeKey, "1", DEDUPE_SECONDS)

    await emitMonitorAlert(container, {
      event_type: "fazer.balance.low",
      severity: "WARNING",
      message: `Saldo Fazer bajo: $${balance.balance_usd.toFixed(2)} USD (umbral $${threshold})`,
      context: { balance_usd: balance.balance_usd, threshold, source: "scheduled_job" },
    })
    logger.warn(`Fazer balance low: $${balance.balance_usd} < $${threshold}`)
  } catch (e) {
    logger.error(`Fazer balance check failed: ${(e as Error).message}`)
  }
}

export const config = {
  name: "check-fazer-balance-alert",
  schedule: "0 * * * *", // every hour
}
