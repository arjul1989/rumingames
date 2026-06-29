import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { localizedAlternates, SITE_DOMAIN, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso de rumin para la compra de gift cards y recargas de videojuegos en Colombia.",
  alternates: localizedAlternates("terminos"),
}

const UPDATED = "27 de junio de 2026"
const PQRS_EMAIL = "info@gorumin.com"
const PQRS_WHATSAPP = "https://wa.me/573001760011"

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
          <h2 className="font-headline text-xl font-bold text-on-surface">
            1. Identificación del proveedor
          </h2>
          <p>
            El sitio web {SITE_DOMAIN} (en adelante, “la Plataforma”) es operado por {SITE_NAME},
            plataforma de comercio electrónico para la venta de gift cards, recargas y productos
            digitales de videojuegos en Colombia. Para cualquier comunicación relacionada con estos
            términos puedes contactarnos a través de los canales indicados en la sección de PQRS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            2. Aceptación y capacidad
          </h2>
          <p>
            Al acceder, registrarte o realizar una compra en la Plataforma aceptas estos Términos y
            Condiciones, nuestra{" "}
            <LocalizedClientLink href="/privacidad" className="text-secondary underline">
              Política de Privacidad
            </LocalizedClientLink>{" "}
            y las políticas complementarias publicadas en el sitio. Debes ser mayor de edad y tener
            capacidad legal para contratar conforme a la legislación colombiana. Si no estás de
            acuerdo con estos términos, abstente de usar la Plataforma.
          </p>
          <p>
            La relación entre {SITE_NAME} y los usuarios se rige por las leyes de la República de
            Colombia, en especial el Estatuto del Consumidor (Ley 1480 de 2011) y las normas
            aplicables al comercio electrónico.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">3. Modificaciones</h2>
          <p>
            Podemos actualizar estos Términos y Condiciones en cualquier momento. Las
            modificaciones entrarán en vigor desde su publicación en la Plataforma. Te recomendamos
            revisar esta página periódicamente. El uso continuado del sitio después de una
            actualización implica la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            4. Descripción del servicio
          </h2>
          <p>
            {SITE_NAME} actúa como intermediario en la comercialización de productos digitales
            emitidos por terceros (plataformas de videojuegos, editores y proveedores
            autorizados). Los productos incluyen, entre otros, gift cards, códigos de recarga y
            suscripciones digitales. La Plataforma opera para el mercado colombiano y los precios se
            expresan en pesos colombianos (COP), salvo que se indique lo contrario.
          </p>
          <p>
            Las marcas, logotipos y contenidos de los videojuegos pertenecen a sus respectivos
            titulares. {SITE_NAME} no es el emisor de los códigos ni reclama propiedad sobre dichas
            marcas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            5. Proceso de compra
          </h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>Selecciona el producto y la variante (monto, plataforma o región).</li>
            <li>Verifica que la región del producto sea compatible con tu cuenta o dispositivo.</li>
            <li>Agrega el producto al carrito y completa tus datos de contacto.</li>
            <li>Elige el medio de pago disponible y confirma la transacción.</li>
            <li>
              Una vez aprobado el pago, el código digital se entrega en tu cuenta y/o al correo
              registrado.
            </li>
          </ol>
          <p>
            El pedido queda sujeto a disponibilidad del proveedor y a la verificación antifraude de
            la pasarela de pago. Nos reservamos el derecho de cancelar pedidos con indicios de
            fraude o uso indebido.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            6. Precios e impuestos
          </h2>
          <p>
            Los precios publicados incluyen los impuestos aplicables en Colombia, salvo indicación
            expresa en contrario. El precio final se muestra antes de confirmar el pago. Nos
            reservamos el derecho de modificar precios en cualquier momento; el precio aplicable es
            el vigente al momento de completar la compra.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">7. Pagos</h2>
          <p>
            Los pagos se procesan a través de pasarelas de pago autorizadas (Mercado Pago, Wompi u
            otras habilitadas en la Plataforma). {SITE_NAME} no almacena datos completos de
            tarjetas de crédito o débito. El pedido se considera confirmado cuando la pasarela
            aprueba la transacción.
          </p>
          <p>
            Si el pago queda pendiente o es rechazado, el pedido no se procesará. Los pagos
            pendientes pueden cancelarse automáticamente transcurrido el tiempo de espera de la
            pasarela.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            8. Entrega de productos digitales
          </h2>
          <p>
            La entrega es exclusivamente electrónica. Una vez confirmado el pago, el código o
            producto digital se muestra en la sección “Mi cuenta → Órdenes” y/o se envía al correo
            electrónico registrado. Los tiempos de entrega suelen ser inmediatos, pero pueden
            variar según el proveedor o la pasarela de pago.
          </p>
          <p>
            Eres responsable de verificar que el correo y los datos del pedido sean correctos antes
            de confirmar la compra. Una vez revelado o entregado el código, queda bajo tu
            responsabilidad su custodia y uso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            9. Derecho de retracto y reembolsos
          </h2>
          <p>
            Conforme al artículo 47 de la Ley 1480 de 2011, el consumidor puede ejercer el derecho
            de retracto dentro de los cinco (5) días hábiles siguientes a la compra, siempre que el
            bien o servicio no haya sido consumido o no haya comenzado a ejecutarse.
          </p>
          <p>
            Por tratarse de bienes digitales de consumo inmediato (códigos, gift cards y recargas),
            una vez que el código ha sido revelado, entregado o redimido, no aplica el derecho de
            retracto, salvo que el producto presente defectos que impidan su uso conforme a lo
            ofrecido.
          </p>
          <p>
            Si por causas atribuibles a {SITE_NAME} o al proveedor un código no puede entregarse,
            se intentará nuevamente o se realizará el reembolso del valor pagado a través del mismo
            medio de pago. Los tiempos de reembolso dependen de la pasarela de pago y la entidad
            emisora.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            10. Garantías y reclamaciones
          </h2>
          <p>
            Si el código entregado no funciona por causas no atribuibles al usuario (código
            inválido, ya utilizado o incompatible con lo ofrecido), contáctanos dentro de un plazo
            razonable con el número de pedido y evidencia del problema. Evaluaremos el caso y, de
            proceder, gestionaremos el reemplazo o reembolso según corresponda.
          </p>
          <p>
            {SITE_NAME} no será responsable por restricciones regionales, suspensiones de cuenta o
            políticas de las plataformas de terceros una vez el código ha sido entregado
            correctamente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            11. PQRS — Peticiones, quejas, reclamos y sugerencias
          </h2>
          <p>
            De acuerdo con la normativa de protección al consumidor en Colombia, ponemos a
            disposición los siguientes canales para radicar peticiones, quejas, reclamos y
            sugerencias (PQRS):
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Correo electrónico:{" "}
              <a className="text-secondary underline" href={`mailto:${PQRS_EMAIL}`}>
                {PQRS_EMAIL}
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                className="text-secondary underline"
                href={PQRS_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                +57 300 176 0011
              </a>
            </li>
          </ul>
          <p>
            Al radicar una PQRS, incluye tu nombre completo, correo electrónico, número de pedido
            (si aplica) y una descripción clara de tu solicitud. Atenderemos tu PQRS en los plazos
            establecidos por la ley colombiana. Para consultas sobre el tratamiento de datos
            personales, escribe a{" "}
            <a className="text-secondary underline" href={`mailto:${PQRS_EMAIL}`}>
              {PQRS_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            12. Uso de la cuenta
          </h2>
          <p>
            Eres responsable de la confidencialidad de tus credenciales y de toda la actividad en
            tu cuenta. Está prohibido el uso fraudulento, la reventa no autorizada, el uso de
            medios de pago ajenos sin autorización y cualquier actividad que vulnere derechos de
            terceros, la ley o las políticas de los proveedores.
          </p>
          <p>
            Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos o
            presenten conductas sospechosas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            13. Propiedad intelectual
          </h2>
          <p>
            Los contenidos de la Plataforma (diseño, textos, logotipos y software) son propiedad
            de {SITE_NAME} o de sus licenciantes y están protegidos por la legislación aplicable. Queda
            prohibida su reproducción o uso no autorizado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            14. Limitación de responsabilidad
          </h2>
          <p>
            La Plataforma se ofrece “tal cual”. No garantizamos disponibilidad ininterrumpida del
            sitio ni ausencia de errores técnicos. {SITE_NAME} no será responsable por daños
            indirectos, lucro cesante ni por usos indebidos de los códigos una vez entregados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            15. Protección de datos personales
          </h2>
          <p>
            El tratamiento de tus datos personales se rige por nuestra{" "}
            <LocalizedClientLink href="/privacidad" className="text-secondary underline">
              Política de Privacidad
            </LocalizedClientLink>
            , conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            16. Ley aplicable y jurisdicción
          </h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República de Colombia.
            Cualquier controversia será sometida a los jueces competentes del territorio
            colombiano, sin perjuicio de los derechos que asisten al consumidor conforme al
            Estatuto del Consumidor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-on-surface">17. Contacto</h2>
          <p>
            Para dudas generales sobre estos términos o sobre tu pedido, puedes escribirnos a{" "}
            <a className="text-secondary underline" href={`mailto:${PQRS_EMAIL}`}>
              {PQRS_EMAIL}
            </a>{" "}
            o contactarnos por WhatsApp en{" "}
            <a
              className="text-secondary underline"
              href={PQRS_WHATSAPP}
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
