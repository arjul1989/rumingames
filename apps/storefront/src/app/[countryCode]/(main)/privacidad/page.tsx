import { Metadata } from "next"
import { localizedAlternates, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de tratamiento de datos personales de Gorumin conforme a la Ley 1581 de 2012 (habeas data) de Colombia.",
  alternates: localizedAlternates("privacidad"),
}

const UPDATED = "22 de junio de 2026"

export default function PrivacidadPage() {
  return (
    <div className="content-container max-w-3xl py-16">
      <header className="mb-10 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">LEGAL</p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Política de Privacidad
        </h1>
        <p className="text-sm text-on-surface-variant/60">Última actualización: {UPDATED}</p>
      </header>

      <div className="space-y-8 text-body-md leading-relaxed text-on-surface-variant/90">
        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            1. Responsable del tratamiento
          </h2>
          <p>
            {SITE_NAME} es responsable del tratamiento de los datos personales recolectados a
            través de la Plataforma. Esta política se rige por la Ley 1581 de 2012 y el Decreto
            1074 de 2015 de Colombia sobre protección de datos personales (habeas data).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            2. Datos que recolectamos
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Datos de identificación y contacto: nombre, correo electrónico, teléfono.</li>
            <li>Datos de pedidos: productos comprados, montos, estado de pago.</li>
            <li>Datos técnicos: dirección IP, cookies y datos de navegación.</li>
          </ul>
          <p>No almacenamos datos de tarjetas; los pagos los procesa Mercado Pago.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">3. Finalidades</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Procesar pedidos y entregar productos digitales.</li>
            <li>Gestionar tu cuenta y soporte al cliente.</li>
            <li>Enviar comunicaciones transaccionales y, con tu consentimiento, promocionales.</li>
            <li>Cumplir obligaciones legales y prevenir fraude.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            4. Derechos del titular
          </h2>
          <p>
            Como titular puedes conocer, actualizar, rectificar y suprimir tus datos, así como
            revocar la autorización otorgada. Para ejercer estos derechos escribe a{" "}
            <a className="text-secondary underline" href="mailto:privacidad@gorumin.com">
              privacidad@gorumin.com
            </a>
            . Atenderemos tu solicitud en los términos de ley.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">5. Cookies</h2>
          <p>
            Usamos cookies propias y de terceros para el funcionamiento del sitio (carrito,
            sesión, detección de país) y para análisis. Puedes gestionar las cookies desde la
            configuración de tu navegador. Al continuar navegando aceptas su uso conforme al
            aviso de cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">6. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y administrativas razonables. Los códigos digitales se
            almacenan cifrados (AES-256-GCM) y nunca se registran en texto plano.
          </p>
        </section>
      </div>
    </div>
  )
}
