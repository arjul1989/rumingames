import { FazerClient } from "./lib/client"

export interface FazerModuleOptions {
  apiKey?: string
  baseUrl?: string
  timeoutMs?: number
  retries?: number
}

// Service-only module (no data models): exposes a configured Fazer client
// resolvable from workflows, subscribers and API routes (US-2.1 / RUM-16).
class FazerModuleService {
  readonly client: FazerClient

  constructor(_: unknown, options: FazerModuleOptions = {}) {
    const apiKey = options.apiKey ?? process.env.FAZER_API_KEY
    if (!apiKey) {
      throw new Error(
        "Fazer module requires FAZER_API_KEY (env or module option)."
      )
    }
    this.client = new FazerClient({
      apiKey,
      baseUrl: options.baseUrl ?? process.env.FAZER_BASE_URL,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
    })
  }

  getCatalog(...args: Parameters<FazerClient["getCatalog"]>) {
    return this.client.getCatalog(...args)
  }

  getBalance() {
    return this.client.getBalance()
  }

  createOrder(...args: Parameters<FazerClient["createOrder"]>) {
    return this.client.createOrder(...args)
  }

  getOrder(...args: Parameters<FazerClient["getOrder"]>) {
    return this.client.getOrder(...args)
  }
}

export default FazerModuleService
