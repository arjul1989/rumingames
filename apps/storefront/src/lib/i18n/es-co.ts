// Textos de interfaz — español Colombia (rumin storefront).

export const addressLabels = {
  firstName: "Nombre",
  lastName: "Apellido",
  address: "Dirección",
  company: "Empresa",
  postalCode: "Código postal",
  city: "Ciudad",
  province: "Estado o departamento",
  country: "País",
  email: "Correo electrónico",
  phone: "Teléfono",
  apartment: "Apartamento, interior, etc.",
  billingAddress: "Dirección de facturación",
  shippingAddress: "Dirección de envío",
  sameAsShipping: "La dirección de facturación es la misma que la de envío",
  chooseAddress: "Elige una dirección",
  savedAddressPrompt: (name: string) =>
    `Hola ${name}, ¿quieres usar una de tus direcciones guardadas?`,
  validEmail: "Ingresa un correo electrónico válido.",
  documentType: "Tipo de documento",
  documentNumber: "Número de documento",
  documentRequired: "El documento es obligatorio para pagos con PSE.",
} as const

export const checkoutLabels = {
  shippingAddress: "Datos de contacto",
  billingAddress: "Datos de facturación",
  contact: "Contacto",
  edit: "Editar",
  continueToDelivery: "Continuar a la entrega",
  continueToPayment: "Continuar al pago",
  sameBillingDelivery: "La dirección de facturación y la de entrega son la misma.",
  delivery: "Entrega",
  shippingMethod: "Método de envío",
  deliveryQuestion: "¿Cómo quieres recibir tu pedido?",
  pickupOrder: "Recoger tu pedido",
  store: "Tienda",
  chooseStore: "Elige una tienda cerca de ti",
  method: "Método",
  inYourCart: "En tu carrito",
  addPromoCode: "Agregar código promocional",
  apply: "Aplicar",
  promosApplied: "Promoción(es) aplicada(s):",
  removePromo: "Quitar código de descuento del pedido",
  cardDetails: "Ingresa los datos de tu tarjeta:",
  testPaymentNotice: "Atención: solo para pruebas.",
  title: "Pago",
  reviewTerms:
    "Al confirmar el pago aceptas nuestros Términos de Uso, Términos de Venta y Política de Reembolsos, y confirmas que has leído la Política de Privacidad de rumin.",
  reviewRegionWarning:
    "Antes de confirmar, verifica que la región de cada tarjeta o producto digital coincida con la de tu dispositivo o consola. Una vez generado el código, no se aceptan devoluciones ni reembolsos.",
  placeOrder: "Realizar pedido",
} as const

export const cartLabels = {
  cart: "Carrito",
  summary: "Resumen",
  subtotalExcl: "Subtotal (sin envío ni impuestos)",
  subtotal: "Subtotal",
  subtotalExclTax: "Subtotal (sin impuestos)",
  shipping: "Envío",
  discount: "Descuento",
  taxes: "Impuestos",
  pricingSubtotalUsd: "Subtotal USD",
  pricingSubtotalLocal: "Subtotal (conversión)",
  pricingCommission: "Comisión pasarela",
  total: "Total",
  goToCheckout: "Ir a pagar",
  goToCart: "Ir al carrito",
  item: "Producto",
  quantity: "Cantidad",
  price: "Precio",
  variant: "Opción",
  remove: "Eliminar",
  empty: "Tu carrito está vacío. Usa el enlace de abajo para explorar nuestros productos.",
  exploreProducts: "Explorar tienda",
  emptyBag: "Tu carrito está vacío.",
  quantityN: (n: number) => `Cantidad: ${n}`,
  signInPrompt: "¿Ya tienes cuenta?",
  signInBetter: "Inicia sesión para una mejor experiencia.",
  signIn: "Iniciar sesión",
  select: "Seleccionar…",
} as const

export const accountLabels = {
  account: "Mi cuenta",
  signIn: "Iniciar sesión",
  register: "Registrarme",
  signOut: "Cerrar sesión",
  myData: "Mis datos",
  myPurchases: "Mis compras",
  paymentMethods: "Mis métodos de pago",
  profile: "Perfil",
  addresses: "Direcciones",
  orders: "Órdenes",
  hello: (name: string) => `Hola, ${name}`,
  helloGuest: "Hola",
  completeName: "Completa tu nombre",
  completeField: "Completa este dato",
  completeEmail: "Completa tu correo",
  completePhone: "Agrega tu teléfono",
  signedInAs: "Sesión iniciada como:",
  completed: "Completado",
  saved: "Guardadas",
  recentOrders: "Órdenes recientes",
  datePlaced: "Fecha del pedido",
  orderNumber: "Número de orden",
  totalAmount: "Monto total",
  goToOrder: (id: string) => `Ir a la orden #${id}`,
  noRecentOrders: "No hay órdenes recientes",
  shippingAddresses: "Direcciones de envío",
  shippingAddressesDesc:
    "Consulta y actualiza tus direcciones de envío; puedes agregar todas las que quieras. Al guardarlas, estarán disponibles en el checkout.",
  newAddress: "Nueva dirección",
  addAddress: "Agregar dirección",
  editAddress: "Editar dirección",
  noBillingAddress: "Sin dirección",
  address: "Dirección",
  password: "Contraseña",
  passwordHidden: "La contraseña no se muestra por seguridad",
  oldPassword: "Contraseña anterior",
  newPassword: "Nueva contraseña",
  confirmPassword: "Confirmar contraseña",
  name: "Nombre",
  cancel: "Cancelar",
  save: "Guardar",
  edit: "Editar",
  saveChanges: "Guardar cambios",
  updatedOk: (label: string) =>
    label === "Dirección"
      ? "Dirección actualizada correctamente"
      : `${label} actualizado correctamente`,
  errorRetry: "Ocurrió un error, inténtalo de nuevo",
  ordersDesc:
    "Consulta tus órdenes anteriores y su estado. También puedes solicitar devoluciones o cambios si lo necesitas.",
  profileDesc:
    "Consulta y actualiza tu información de perfil, incluido nombre, correo y teléfono. También puedes actualizar tu dirección o cambiar tu contraseña.",
  paymentMethodsDesc:
    "Guarda tarjetas de crédito o débito de forma segura con Mercado Pago para pagar más rápido en tus próximas compras.",
  addPaymentMethod: "Agregar tarjeta",
  noPaymentMethods: "Aún no tienes tarjetas guardadas.",
  noPaymentMethodsHint:
    "Agrega una tarjeta para usarla en el checkout sin volver a ingresar los datos.",
  cardEnding: (last4: string) => `Terminada en ${last4}`,
  removeCard: "Eliminar tarjeta",
  defaultCard: "Predeterminada",
  loginTitle: "Bienvenido de nuevo",
  loginSubtitle: "Inicia sesión para acceder a tus órdenes y códigos.",
  registerTitle: "Crear cuenta",
  registerSubtitle: "Únete a rumin para guardar tus órdenes y revelar tus códigos.",
} as const

export const orderLabels = {
  orderSummary: "Resumen del pedido",
  orderDate: "Fecha del pedido:",
  orderNumber: "Número de orden:",
  orderStatus: "Estado del pedido:",
  paymentStatus: "Estado del pago:",
  confirmationSent: (email: string) =>
    `Enviamos la confirmación del pedido a ${email}.`,
  delivery: "Entrega",
  shippingAddress: "Dirección de envío",
  contact: "Contacto",
  method: "Método",
  payment: "Pago",
  paymentMethod: "Método de pago",
  paymentDetails: "Detalles de pago",
  paidAt: (amount: string, date: string) => `${amount} pagado el ${date}`,
  thankYou: "¡Gracias!",
  orderPlaced: "Tu pedido se realizó con éxito.",
  summary: "Resumen",
  needHelp: "¿Necesitas ayuda?",
  returns: "Devoluciones y cambios",
  viewMyOrders: "Ver mis compras",
  goHome: "Ir al inicio",
} as const

export const fundingLabels = {
  checkoutSuccessTitle: "¡Gracias por tu compra!",
  checkoutSuccessBody:
    "Estamos generando tu código. Tu compra está en proceso y en unos minutos lo recibirás en tu correo. También podrás verlo aquí en Mis compras.",
  checkoutSuccessGuestBody:
    "Estamos generando tu código digital. En cuanto esté listo lo enviaremos al correo que usaste en esta compra.",
  checkoutSuccessLoggedInBody:
    "Estamos generando tu código. En unos minutos lo recibirás en tu correo y también podrás verlo en Mis compras.",
  checkoutSuccessLegacyBody:
    "Tu pago fue aprobado. Tus códigos digitales aparecen abajo y también quedan disponibles en cualquier momento desde tus pedidos.",
  checkoutSuccessGuestAccountHint:
    "Si creas una cuenta o inicias sesión con el mismo correo de la compra, podrás ver todos tus pedidos y códigos en tu perfil.",
  checkoutSuccessGuestCta: "Crear cuenta / Iniciar sesión",
  checkoutSuccessViewOrders: "Ver mis compras",
  checkoutPendingGuestHint:
    "Cuando se confirme el pago, enviaremos tu código al correo de la compra. Puedes crear una cuenta con ese correo para ver tus pedidos.",
  checkoutPendingExhaustedGuest:
    "El pago sigue procesándose. Te enviaremos un correo al confirmarse la compra.",
  checkoutPendingExhaustedLoggedIn:
    "El pago sigue procesándose. Te enviaremos un correo cuando se confirme; también puedes revisar el estado en Mis compras.",
  orderInProgress: "En proceso",
  generatingCode:
    "Estamos generando tu código. En unos minutos lo enviaremos a tu correo y aparecerá aquí.",
  orderCardInProgressHint: "Generando tu código digital",
} as const

export const paymentMethodLabels: Record<string, string> = {
  pp_stripe_stripe: "Tarjeta de crédito",
  "pp_stripe-ideal_stripe": "iDeal",
  "pp_stripe-bancontact_stripe": "Bancontact",
  pp_paypal_paypal: "PayPal",
  pp_system_default: "Pago manual",
}

const ORDER_STATUS_ES: Record<string, string> = {
  not_fulfilled: "Pendiente de entrega",
  fulfilled: "Entregado",
  partially_fulfilled: "Parcialmente entregado",
  shipped: "Enviado",
  partially_shipped: "Parcialmente enviado",
  canceled: "Cancelado",
  requires_action: "Requiere acción",
  not_paid: "Sin pagar",
  awaiting: "En espera",
  captured: "Pagado",
  partially_refunded: "Parcialmente reembolsado",
  refunded: "Reembolsado",
  canceled_payment: "Pago cancelado",
  pending: "Pendiente",
  authorized: "Autorizado",
}

/** Traduce estados de orden/pago del API Medusa al español. */
export function translateOrderStatus(status: string): string {
  return ORDER_STATUS_ES[status] ?? status.replace(/_/g, " ")
}
