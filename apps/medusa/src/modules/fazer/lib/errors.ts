// Typed errors for the Fazer Cards client (US-2.1 / RUM-16).

export class FazerApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? `Fazer API error (status ${status})`)
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
