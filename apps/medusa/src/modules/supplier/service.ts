import { MedusaService } from "@medusajs/framework/utils"
import SupplierProductMapping from "./models/supplier-product-mapping"
import PriceSyncLog from "./models/price-sync-log"
import FazerCategory from "./models/fazer-category"
import FazerOffer from "./models/fazer-offer"
import FazerConfig from "./models/fazer-config"
import MpPaymentConfig from "./models/mp-payment-config"
import CountryPaymentGateway from "./models/country-payment-gateway"
import SupportTrace from "./models/support-trace"
import FazerWalletTopup from "./models/fazer-wallet-topup"

class SupplierModuleService extends MedusaService({
  SupplierProductMapping,
  PriceSyncLog,
  FazerCategory,
  FazerOffer,
  FazerConfig,
  MpPaymentConfig,
  CountryPaymentGateway,
  SupportTrace,
  FazerWalletTopup,
}) {}

export default SupplierModuleService
