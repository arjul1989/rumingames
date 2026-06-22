import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"
import SupplierModule from "../modules/supplier"

// Associates a Medusa product with its supplier mapping, keeping modules isolated.
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: SupplierModule.linkable.supplierProductMapping,
    isList: true,
  }
)
