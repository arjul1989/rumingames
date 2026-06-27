import { Module } from "@medusajs/framework/utils"
import FundingModuleService from "./service"

export const FUNDING_MODULE = "funding"

export default Module(FUNDING_MODULE, {
  service: FundingModuleService,
})
