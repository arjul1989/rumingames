/** Local dev mocks — never enabled in production. */
export function isDevMocksAllowed(): boolean {
  return process.env.NODE_ENV !== "production"
}

export function isMockMpEnabled(): boolean {
  return isDevMocksAllowed() && process.env.MOCK_MP === "true"
}

export function isMockFazerEnabled(): boolean {
  return isDevMocksAllowed() && process.env.MOCK_FAZER === "true"
}

export function isMockWompiEnabled(): boolean {
  return isDevMocksAllowed() && process.env.MOCK_WOMPI === "true"
}

export function mockMpBackendBase(): string {
  return (process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")
}

export function mockStorefrontBase(): string {
  return (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "")
}
