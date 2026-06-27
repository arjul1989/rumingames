import type {
  WompiCardToken,
  WompiMerchant,
  WompiThreeDsAuth,
  WompiTransaction,
} from "./types"

const store = new Map<string, WompiTransaction>()

const MOCK_MERCHANT: WompiMerchant = {
  presigned_acceptance: {
    acceptance_token: "mock_acceptance_token",
    permalink:
      "https://wompi.co/wp-content/uploads/2019/09/TERMINOS-Y-CONDICIONES-DE-USO-USUARIOS-WOMPI.pdf",
    type: "END_USER_POLICY",
  },
  presigned_personal_data_auth: {
    acceptance_token: "mock_personal_auth_token",
    permalink:
      "https://wompi.com/assets/downloadble/autorizacion-administracion-datos-personales.pdf",
    type: "PERSONAL_DATA_AUTH",
  },
}

export function createMockWompiClient() {
  return {
    getMerchant(): Promise<WompiMerchant> {
      return Promise.resolve(MOCK_MERCHANT)
    },

    tokenizeCard(input: {
      number: string
      cvc: string
      exp_month: string
      exp_year: string
      card_holder: string
    }): Promise<WompiCardToken> {
      return Promise.resolve({
        id: `tok_mock_${input.number.slice(-4)}`,
        brand: input.number.startsWith("4") ? "VISA" : "MASTERCARD",
        last_four: input.number.slice(-4),
        exp_month: input.exp_month,
        exp_year: input.exp_year,
        card_holder: input.card_holder,
      })
    },

    createTransaction(body: Record<string, unknown>): Promise<WompiTransaction> {
      const reference = String(body.reference ?? "mock-ref")
      const authType = String(body.three_ds_auth_type ?? "no_challenge_success")
      const id = `mock-tx-${Date.now()}`

      let status: WompiTransaction["status"] = "PENDING"
      let three_ds_auth: WompiThreeDsAuth

      if (authType === "no_challenge_success") {
        status = "APPROVED"
        three_ds_auth = {
          current_step: "AUTHENTICATION",
          current_step_status: "COMPLETED",
        }
      } else if (authType === "challenge_denied") {
        status = "DECLINED"
        three_ds_auth = {
          current_step: "AUTHENTICATION",
          current_step_status: "Non-Authenticated",
        }
      } else if (authType === "challenge_v2") {
        status = "PENDING"
        three_ds_auth = {
          current_step: "CHALLENGE",
          current_step_status: "PENDING",
          three_ds_method_data:
            "&lt;iframe src=&quot;about:blank&quot; width=&quot;100%&quot; height=&quot;420&quot;&gt;&lt;/iframe&gt;",
        }
      } else {
        status = "ERROR"
        three_ds_auth = {
          current_step: "AUTHENTICATION",
          current_step_status: "ERROR",
        }
      }

      const tx: WompiTransaction = {
        id,
        reference,
        amount_in_cents: Number(body.amount_in_cents ?? 0),
        currency: String(body.currency ?? "COP"),
        customer_email: String(body.customer_email ?? ""),
        payment_method_type: "CARD",
        payment_method: {
          type: "CARD",
          installments: 1,
          extra: {
            brand: "MASTERCARD",
            last_four: "4242",
            is_three_ds: true,
            three_ds_auth_type: authType,
            three_ds_auth,
          },
        },
        status,
        status_message: null,
        redirect_url: null,
      }

      store.set(id, tx)
      return Promise.resolve({ ...tx })
    },

    getTransaction(id: string): Promise<WompiTransaction> {
      const tx = store.get(id)
      if (!tx) {
        throw new Error(`Mock Wompi transaction not found: ${id}`)
      }

      const auth = tx.payment_method?.extra?.three_ds_auth
      if (
        auth?.current_step === "CHALLENGE" &&
        auth.current_step_status === "PENDING"
      ) {
        const approved: WompiTransaction = {
          ...tx,
          status: "APPROVED",
          payment_method: {
            ...tx.payment_method,
            extra: {
              ...tx.payment_method?.extra,
              three_ds_auth: {
                current_step: "AUTHENTICATION",
                current_step_status: "COMPLETED",
              },
            },
          },
        }
        store.set(id, approved)
        return Promise.resolve(approved)
      }

      return Promise.resolve({ ...tx })
    },

    voidTransaction(id: string): Promise<WompiTransaction> {
      const tx = store.get(id)
      if (!tx) {
        throw new Error(`Mock Wompi transaction not found: ${id}`)
      }
      const updated = { ...tx, status: "VOIDED" as const }
      store.set(id, updated)
      return Promise.resolve(updated)
    },

    seedTransaction(tx: WompiTransaction) {
      store.set(tx.id, tx)
    },
  }
}

export type MockWompiClient = ReturnType<typeof createMockWompiClient>
