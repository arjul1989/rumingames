import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { localizedAlternates, SITE_DOMAIN, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de tratamiento de datos personales de rumin conforme a la Ley 1581 de 2012 (habeas data) de Colombia.",
  alternates: localizedAlternates("privacidad"),
}

const UPDATED = "27 de junio de 2026"
const CONTACT_EMAIL = "info@gorumin.com"
const CONTACT_WHATSAPP = "https://wa.me/573001760011"

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
            {SITE_NAME}, operador del sitio web {SITE_DOMAIN} (en adelante, “la Plataforma”), es
            responsable del tratamiento de los datos personales recolectados a través de la
            Plataforma. Esta política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 y
            demás normas aplicables en Colombia sobre protección de datos personales (habeas data).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            2. Alcance
          </h2>
          <p>
            Esta Política de Privacidad aplica al tratamiento de datos personales de usuarios,
            visitantes y clientes que interactúan con la Plataforma, incluyendo la creación de
            cuenta, la navegación, la compra de productos digitales y la atención al cliente. Al
            usar la Plataforma aceptas las prácticas descritas en este documento y en nuestros{" "}
            <LocalizedClientLink href="/terminos" className="text-secondary underline">
              Términos y Condiciones
            </LocalizedClientLink>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            3. Datos que recolectamos
          </h2>
          <p>Podemos recolectar las siguientes categorías de datos personales:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Identificación y contacto:</strong> nombre, apellido, correo electrónico,
              teléfono y documento de identidad (cuando sea requerido para el pago).
            </li>
            <li>
              <strong>Datos de cuenta:</strong> credenciales de acceso, preferencias y historial de
              pedidos.
            </li>
            <li>
              <strong>Datos transaccionales:</strong> productos adquiridos, montos, estado de pago
              y referencias de transacción.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP, tipo de navegador, dispositivo,
              cookies y datos de navegación.
            </li>
          </ul>
          <p>
            No almacenamos datos completos de tarjetas de crédito o débito. Los pagos se procesan
            a través de pasarelas autorizadas (Mercado Pago, Wompi u otras habilitadas en la
            Plataforma).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            4. Finalidades del tratamiento
          </h2>
          <p>Tratamos tus datos personales para las siguientes finalidades:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Crear y administrar tu cuenta de usuario.</li>
            <li>Procesar pedidos y entregar productos digitales.</li>
            <li>Gestionar pagos, facturación y prevención de fraude.</li>
            <li>Brindar soporte al cliente y atender PQRS.</li>
            <li>Enviar comunicaciones transaccionales (confirmaciones, códigos, alertas).</li>
            <li>
              Enviar comunicaciones promocionales, solo con tu consentimiento previo y revocable.
            </li>
            <li>Cumplir obligaciones legales y regulatorias.</li>
            <li>Mejorar la Plataforma mediante análisis agregados de uso.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            5. Autorización
          </h2>
          <p>
            Al registrarte, realizar una compra o proporcionarnos datos voluntariamente, autorizas
            el tratamiento de tus datos personales conforme a esta política. Para finalidades
            distintas a las descritas solicitaremos tu consentimiento expreso cuando la ley lo
            exija.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            6. Transferencia y encargados del tratamiento
          </h2>
          <p>
            Podemos compartir datos con proveedores que nos prestan servicios necesarios para
            operar la Plataforma, como pasarelas de pago, servicios de correo electrónico,
            infraestructura en la nube y proveedores de productos digitales. Estos terceros actúan
            como encargados del tratamiento y están obligados a proteger tus datos conforme a la
            normativa aplicable.
          </p>
          <p>
            No vendemos ni comercializamos tus datos personales a terceros con fines publicitarios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            7. Derechos del titular
          </h2>
          <p>
            Como titular de datos personales tienes derecho a conocer, actualizar, rectificar y
            suprimir tu información, así como a revocar la autorización otorgada y presentar
            quejas ante la Superintendencia de Industria y Comercio (SIC), conforme a la Ley 1581
            de 2012.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            8. Cómo ejercer tus derechos
          </h2>
          <p>
            Para ejercer tus derechos de habeas data, envía una solicitud a{" "}
            <a className="text-secondary underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            indicando tu nombre completo, tipo y número de documento, descripción de la solicitud y
            medio de contacto para la respuesta. Atenderemos tu solicitud en los plazos
            establecidos por la ley colombiana.
          </p>
          <p>
            También puedes contactarnos por WhatsApp en{" "}
            <a
              className="text-secondary underline"
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              +57 300 176 0011
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">9. Cookies</h2>
          <p>
            Usamos cookies propias y de terceros para el funcionamiento del sitio (carrito, sesión,
            detección de país) y para análisis. Puedes gestionar las cookies desde la
            configuración de tu navegador. Al continuar navegando aceptas su uso conforme al aviso
            de cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">10. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y administrativas razonables para proteger tus datos
            personales. Los códigos digitales se almacenan cifrados (AES-256-GCM) y nunca se
            registran en texto plano. Ningún sistema es completamente infalible; te recomendamos
            proteger tus credenciales de acceso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            11. Conservación de datos
          </h2>
          <p>
            Conservamos tus datos personales durante el tiempo necesario para cumplir las
            finalidades descritas, atender obligaciones legales y resolver disputas. Una vez
            cumplidos esos plazos, los datos serán eliminados o anonimizados de forma segura.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            12. Cambios a esta política
          </h2>
          <p>
            Podemos actualizar esta Política de Privacidad en cualquier momento. Las modificaciones
            entrarán en vigor desde su publicación en la Plataforma. Te recomendamos revisar esta
            página periódicamente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">13. Contacto</h2>
          <p>
            Para consultas sobre el tratamiento de datos personales, PQRS o atención general,
            contáctanos en{" "}
            <a className="text-secondary underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            o por WhatsApp en{" "}
            <a
              className="text-secondary underline"
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              wa.me/573001760011
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
