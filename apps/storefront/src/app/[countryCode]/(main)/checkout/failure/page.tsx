import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pago no completado",
  description: "No pudimos procesar tu pago.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ reason?: string }>
}

export default async function CheckoutFailurePage({ searchParams }: Props) {
  const { reason } = await searchParams

  return (
    <div className="content-container flex flex-col gap-8 py-12">
      <div className="hyper-glass flex flex-col items-center gap-5 rounded-2xl px-8 py-14 text-center">
        <span className="font-mono text-label-caps tracking-widest text-error">
          PAGO RECHAZADO
        </span>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          No pudimos procesar tu pago
        </h1>
        <p className="max-w-lg text-on-surface-variant/80">
          {reason
            ? reason
            : "Tu pago no se completó. No se realizó ningún cargo. Revisa los datos de tu tarjeta o intenta con otro método."}
        </p>
      </div>

      <div className="flex flex-col gap-3 small:flex-row">
        <LocalizedClientLink
          href="/checkout?step=payment"
          className="brutalist-button flex-1 bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        >
          REINTENTAR PAGO
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/cart"
          className="brutalist-button flex-1 bg-surface-container px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-surface transition-transform hover:scale-[1.02]"
        >
          VOLVER AL CARRITO
        </LocalizedClientLink>
      </div>
    </div>
  )
}
