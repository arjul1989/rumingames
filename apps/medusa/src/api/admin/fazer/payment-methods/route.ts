import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAZER_MODULE } from "../../../../modules/fazer"
import type FazerModuleService from "../../../../modules/fazer/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fazer = req.scope.resolve<FazerModuleService>(FAZER_MODULE)
  try {
    const methods = await fazer.listPaymentMethods()
    res.json({ methods })
  } catch (err) {
    res.status(500).json({ message: (err as Error).message, methods: [] })
  }
}
