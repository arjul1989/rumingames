import { Module } from "@medusajs/framework/utils"
import FazerModuleService from "./service"

export const FAZER_MODULE = "fazer"

export default Module(FAZER_MODULE, {
  service: FazerModuleService,
})
