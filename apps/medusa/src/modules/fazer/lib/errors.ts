// Typed errors for the Fazer Cards client (US-2.1 / RUM-16).

function fazerErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>
    if (typeof record.error === "string" && record.error.trim()) {
      const code = typeof record.code === "string" ? ` (${record.code})` : ""
      return `Fazer API: ${record.error}${code}`
    }
  }
  return `Fazer API error (status ${status})`
}

export class FazerApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? fazerErrorMessage(status, body))
    this.name = "FazerApiError"
  }
}

export class FazerTimeoutError extends Error {
  constructor(public timeoutMs: number) {
    super(`Fazer API request timed out after ${timeoutMs}ms`)
    this.name = "FazerTimeoutError"
  }
}

export class FazerNetworkError extends Error {
  constructor(cause: unknown) {
    super(`Fazer API network error: ${(cause as Error)?.message ?? cause}`)
    this.name = "FazerNetworkError"
  }
}
