import type { MedusaContainer } from "@medusajs/framework"
import { sendEmail } from "./email/send-email"

// Structured monitoring events for Cloud Logging + operator alerts (US-10.3 / RUM-67).
// On Cloud Run, JSON logs on stdout are ingested automatically by Cloud Logging.
// Log-based metrics and alert policies can filter on `jsonPayload.event_type`.

export type MonitorEventType =
  | "fulfillment.failed"
  | "funding.failed"
  | "payment.webhook.error"
  | "fazer.balance.low"
  | "health.check.failed"

export type MonitorSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export interface MonitorEvent {
  event_type: MonitorEventType
  severity: MonitorSeverity
  message: string
  service: "gorumin-medusa"
  context?: Record<string, unknown>
  timestamp: string
}

const ALERT_EMAIL_TYPES: MonitorEventType[] = [
  "fulfillment.failed",
  "funding.failed",
  "payment.webhook.error",
  "fazer.balance.low",
  "health.check.failed",
]

export function logMonitorEvent(event: Omit<MonitorEvent, "timestamp" | "service">): MonitorEvent {
  const payload: MonitorEvent = {
    ...event,
    service: "gorumin-medusa",
    timestamp: new Date().toISOString(),
  }
  // Cloud Logging picks up structured JSON from stdout.
  console.log(JSON.stringify({ gorumin_monitor: true, ...payload }))
  return payload
}

/** Logs the event and optionally emails the operator (ADMIN_ALERT_EMAIL). */
export async function emitMonitorAlert(
  container: MedusaContainer,
  event: Omit<MonitorEvent, "timestamp" | "service">
): Promise<void> {
  const logged = logMonitorEvent(event)
  if (!ALERT_EMAIL_TYPES.includes(event.event_type)) return

  const to = process.env.ADMIN_ALERT_EMAIL
  if (!to) return

  try {
    await sendEmail(container, {
      to,
      template: "monitor-alert",
      data: {
        subject: `[rumin][${event.severity}] ${event.event_type}`,
        message: event.message,
        details: JSON.stringify(event.context ?? {}, null, 2),
      },
    })
  } catch {
    // Alert delivery must not break the main flow.
  }

  void logged
}
