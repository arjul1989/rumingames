import { Metadata } from "next"
import { localizedAlternates, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso de Gorumin para la compra de gift cards y recargas de videojuegos en Colombia.",
  alternates: localizedAlternates("terminos"),
}

const UPDATED = "22 de junio de 2026"

export default function TerminosPage() {
  return (
    <div className="content-container max-w-3xl py-16">
      <header className="mb-10 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">LEGAL</p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Términos y Condiciones
        </h1>
        <p className="text-sm text-on-surface-variant/60">Última actualización: {UPDATED}</p>
      </header>

      <div className="space-y-8 text-body-md leading-relaxed text-on-surface-variant/90">
        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">1. Aceptación</h2>
          <p>
            Al acceder y utilizar {SITE_NAME} (en adelante, “la Plataforma”) aceptas estos
            Términos y Condiciones. Si no estás de acuerdo, abstente de usar la Plataforma. La
            Plataforma opera para el mercado de Colombia y los precios se expresan en pesos
            colombianos (COP).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            2. Productos digitales
          </h2>
          <p>
            {SITE_NAME} comercializa gift cards, recargas y productos digitales de terceros. La
            entrega es electrónica: el código se muestra en tu cuenta y/o se envía al correo
            registrado una vez confirmado el pago. Por tratarse de bienes digitales de consumo
            inmediato, una vez revelado el código no aplican retractos, salvo que el producto
            presente defectos que impidan su uso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">3. Pagos</h2>
          <p>
            Los pagos se procesan a través de Mercado Pago. {SITE_NAME} no almacena datos de
            tarjetas. El pedido se considera confirmado cuando el proveedor de pago aprueba la
            transacción. Si el pago queda pendiente, el pedido podrá cancelarse automáticamente
            transcurrido el tiempo de espera.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            4. Entrega y fallos
          </h2>
          <p>
            Si por causas del proveedor un código no puede entregarse, se intentará nuevamente o
            se realizará el reembolso del valor pagado a través del mismo medio de pago. Los
            tiempos de reembolso dependen de Mercado Pago y la entidad emisora.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            5. Uso de la cuenta
          </h2>
          <p>
            Eres responsable de la confidencialidad de tus credenciales y de la actividad en tu
            cuenta. Está prohibido el uso fraudulento, la reventa no autorizada y cualquier
            actividad que vulnere derechos de terceros o de los proveedores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            6. Propiedad intelectual
          </h2>
          <p>
            Las marcas, logotipos y contenidos de los videojuegos pertenecen a sus respectivos
            titulares. {SITE_NAME} actúa como distribuidor y no reclama propiedad sobre dichas
            marcas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            7. Limitación de responsabilidad
          </h2>
          <p>
            {SITE_NAME} no será responsable por usos indebidos de los códigos una vez entregados,
            ni por restricciones regionales impuestas por las plataformas de los videojuegos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">8. Contacto</h2>
          <p>
            Para dudas sobre estos términos, escríbenos a{" "}
            <a className="text-secondary underline" href="mailto:soporte@gorumin.com">
              soporte@gorumin.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
