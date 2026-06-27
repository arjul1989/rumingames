import type { MedusaContainer } from "@medusajs/framework"
import { SUPPLIER_MODULE } from "../../modules/supplier"
import type SupplierModuleService from "../../modules/supplier/service"

export type SupportTraceStage =
  | "storefront"
  | "payment"
  | "fazer_order"
  | "fazer_payment"
  | "email"
  | "webhook_mp"
  | "webhook_fazer"
  | "binance"

export type LogSupportTraceInput = {
  email?: string | null
  order_id?: string | null
  ref_type?: string | null
  ref_id?: string | null
  stage: SupportTraceStage
  label: string
  endpoint?: string | null
  method?: string | null
  request?: unknown
  response?: unknown
  status_code?: number | null
  error_message?: string | null
}

function sanitizeForLog(value: unknown): unknown {
  if (value == null) return value
  if (typeof value === "string") {
    if (value.length > 8000) return `${value.slice(0, 8000)}…[truncated]`
    return value
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map(sanitizeForLog)
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/secret|password|api[_-]?key|authorization/i.test(k)) {
        out[k] = "[redacted]"
      } else {
        out[k] = sanitizeForLog(v)
      }
    }
    return out
  }
  return value
}

/** Fire-and-forget support trace; never throws to callers. */
export async function logSupportTrace(
  container: MedusaContainer,
  input: LogSupportTraceInput
): Promise<void> {
  try {
    const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
    await supplier.createSupportTraces({
      email: input.email ?? null,
      order_id: input.order_id ?? null,
      ref_type: input.ref_type ?? null,
      ref_id: input.ref_id ?? null,
      stage: input.stage,
      label: input.label,
      endpoint: input.endpoint ?? null,
      method: input.method ?? null,
      request_json: sanitizeForLog(input.request) as Record<string, unknown> | null,
      response_json: sanitizeForLog(input.response) as Record<string, unknown> | null,
      status_code: input.status_code ?? null,
      error_message: input.error_message ?? null,
    })
  } catch (err) {
    console.warn("[support_trace] failed to persist:", (err as Error).message)
  }
}
