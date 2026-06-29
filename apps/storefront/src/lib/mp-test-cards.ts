/** Mercado Pago Colombia sandbox test cards (official docs). */
export const MP_CO_TEST_CARDS = {
  credit: {
    label: "Tarjeta de crédito",
    visa: "4509 9535 6623 3704",
    mastercard: "5031 7557 3450 0604",
  },
  debit: {
    label: "Tarjeta de débito",
    visa: "4916 1100 0000 0000",
    mastercard: "5299 9912 3456 7890",
  },
  shared: {
    cvv: "123",
    expiry: "11/30",
    name: "APRO",
  },
} as const
