import { FazerClient } from "./lib/client"
import { createMockFazerClient } from "./lib/mock-client"
import { isMockFazerEnabled } from "../../lib/dev-mocks"

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
  private readonly mockOrders_ = isMockFazerEnabled()
    ? createMockFazerClient()
    : null

  constructor(_: unknown, options: FazerModuleOptions = {}) {
    const mockMode = isMockFazerEnabled()
    const apiKey =
      options.apiKey ?? process.env.FAZER_API_KEY ?? (mockMode ? "mock-fazer-local" : undefined)
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
    if (this.mockOrders_) {
      console.warn(
        "MOCK_FAZER=true — createOrder/getOrder return instant mock gift-card codes."
      )
    }
  }

  getCatalog(...args: Parameters<FazerClient["getCatalog"]>) {
    return this.client.getCatalog(...args)
  }

  listCatalogItemsForSkus(...args: Parameters<FazerClient["listCatalogItemsForSkus"]>) {
    return this.client.listCatalogItemsForSkus(...args)
  }

  listGiftCardCategories(...args: Parameters<FazerClient["listGiftCardCategories"]>) {
    return this.client.listGiftCardCategories(...args)
  }

  listTopupCategories(...args: Parameters<FazerClient["listTopupCategories"]>) {
    return this.client.listTopupCategories(...args)
  }

  getGiftCardCategoryDetail(...args: Parameters<FazerClient["getGiftCardCategoryDetail"]>) {
    return this.client.getGiftCardCategoryDetail(...args)
  }

  getTopupCategoryDetail(...args: Parameters<FazerClient["getTopupCategoryDetail"]>) {
    return this.client.getTopupCategoryDetail(...args)
  }

  getBalance() {
    return this.client.getBalance()
  }

  createOrder(...args: Parameters<FazerClient["createOrder"]>) {
    if (this.mockOrders_) {
      return this.mockOrders_.createOrder(...args)
    }
    return this.client.createOrder(...args)
  }

  getOrder(...args: Parameters<FazerClient["getOrder"]>) {
    if (this.mockOrders_) {
      return this.mockOrders_.getOrder(...args)
    }
    return this.client.getOrder(...args)
  }

  listPaymentMethods(...args: Parameters<FazerClient["listPaymentMethods"]>) {
    return this.client.listPaymentMethods(...args)
  }

  createPayment(...args: Parameters<FazerClient["createPayment"]>) {
    if (this.mockOrders_) {
      return this.mockOrders_.createPayment(...args)
    }
    return this.client.createPayment(...args)
  }

  getPayment(...args: Parameters<FazerClient["getPayment"]>) {
    if (this.mockOrders_) {
      return this.mockOrders_.getPayment(...args)
    }
    return this.client.getPayment(...args)
  }

  confirmPayment(...args: Parameters<FazerClient["confirmPayment"]>) {
    if (this.mockOrders_) {
      return this.mockOrders_.getPayment(args[0])
    }
    return this.client.confirmPayment(...args)
  }
}

export default FazerModuleService
