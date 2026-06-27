import type {
  CreateEpaycoChargeInput,
  EpaycoChargeResponse,
  EpaycoCustomer,
  EpaycoToken,
  EpaycoTransaction,
} from "./types"
import { EPAYCO_THREE_DS_NETWORK_CODE } from "./three-ds"

const store = new Map<string, EpaycoTransaction>()
const customers = new Map<string, EpaycoCustomer>()

export function createMockEpaycoClient() {
  return {
    createToken(input: {
      number: string
      exp_year: string
      exp_month: string
      cvc: string
    }): Promise<EpaycoToken> {
      return Promise.resolve({
        id: `tok_mock_${input.number.slice(-4)}`,
        status: "accepted",
        card: {
          last4: input.number.slice(-4),
          brand: input.number.startsWith("4") ? "VISA" : "MASTERCARD",
        },
      })
    },

    createCustomer(input: {
      tokenCard: string
      email: string
      name: string
      lastName: string
    }): Promise<EpaycoCustomer> {
      const customerId = `cust_mock_${input.email.replace(/[^a-z0-9]/gi, "")}`
      const customer = { customerId, email: input.email }
      customers.set(customerId, customer)
      return Promise.resolve(customer)
    },

    createCharge(input: CreateEpaycoChargeInput): Promise<EpaycoChargeResponse> {
      const authType = process.env.EPAYCO_THREE_DS_AUTH_TYPE || "challenge"
      const ref = `mock-ref-${Date.now()}`
      const tx: EpaycoTransaction = {
        ref_payco: ref,
        factura: input.reference,
        descripcion: input.description ?? `Pedido ${input.reference}`,
        valor: String(Math.round(input.amountPesos)),
        moneda: "COP",
        estado: "Pendiente",
        respuesta: "Pendiente 3DS",
        email: input.customerEmail,
      }

      if (authType === "no_challenge_success") {
        tx.estado = "Aceptada"
        tx.respuesta = "Aprobada"
        store.set(ref, tx)
        return Promise.resolve({ success: true, data: tx })
      }

      if (authType === "challenge_denied") {
        tx.estado = "Rechazada"
        tx.respuesta = "Rechazada"
        store.set(ref, tx)
        return Promise.resolve({ success: true, data: tx })
      }

      store.set(ref, tx)
      return Promise.resolve({
        success: true,
        data: tx,
        "3DS": {
          data: {
            resultCode: "IdentifyShopper",
            action: {
              threeDSMethodURL: "https://example.com/3ds-method",
            },
          },
          methodData: JSON.stringify({
            threeDSMethodData: btoa(
              JSON.stringify({
                threeDSMethodNotificationURL: "https://example.com/notify",
              })
            ),
          }),
        },
        cc_network_response: { code: EPAYCO_THREE_DS_NETWORK_CODE, message: "3DS required" },
      })
    },

    getTransaction(refPayco: string): Promise<EpaycoTransaction> {
      const tx = store.get(refPayco)
      if (!tx) {
        throw new Error(`Mock ePayco transaction not found: ${refPayco}`)
      }

      if (tx.estado === "Pendiente") {
        const approved: EpaycoTransaction = {
          ...tx,
          estado: "Aceptada",
          respuesta: "Aprobada",
        }
        store.set(refPayco, approved)
        return Promise.resolve(approved)
      }

      return Promise.resolve({ ...tx })
    },

    seedTransaction(tx: EpaycoTransaction) {
      store.set(String(tx.ref_payco), tx)
    },
  }
}

export type MockEpaycoClient = ReturnType<typeof createMockEpaycoClient>
