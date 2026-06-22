import { ExecArgs } from "@medusajs/framework/types"
import { FAZER_MODULE } from "../modules/fazer"
import type FazerModuleService from "../modules/fazer/service"

// Confirms the Fazer module resolves and exposes a configured client.
// Run with: FAZER_API_KEY=test npx medusa exec ./src/scripts/verify-fazer.ts
export default async function verifyFazer({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  logger.info(
    `Fazer module resolved. Client configured: ${!!fazer.client}, ` +
      `methods: ${["getCatalog", "getBalance", "createOrder", "getOrder"]
        .filter((m) => typeof (fazer as any)[m] === "function")
        .join(", ")}`
  )
}
