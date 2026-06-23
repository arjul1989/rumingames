import { Metadata } from "next"
import { localizedAlternates, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Contacto",
  description: `Contacta al equipo de soporte de ${SITE_NAME}. Atención para Colombia.`,
  alternates: localizedAlternates("contacto"),
}

const CONTACTS = [
  { icon: "support_agent", label: "Soporte", value: "soporte@gorumin.com", href: "mailto:soporte@gorumin.com" },
  { icon: "privacy_tip", label: "Privacidad / Habeas data", value: "privacidad@gorumin.com", href: "mailto:privacidad@gorumin.com" },
]

export default function ContactoPage() {
  return (
    <div className="content-container max-w-3xl py-16">
      <header className="mb-10 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">COMUNIDAD</p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Contacto
        </h1>
        <p className="max-w-xl text-on-surface-variant/80">
          ¿Tienes dudas sobre un pedido o un código? Escríbenos y te ayudamos. Atención para
          Colombia 🇨🇴.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONTACTS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="hyper-glass flex items-center gap-4 rounded-xl p-5 transition-colors hover:border-primary/50"
          >
            <span className="material-symbols-outlined text-secondary">{c.icon}</span>
            <div>
              <span className="font-mono text-[10px] tracking-widest text-on-surface-variant/60">
                {c.label.toUpperCase()}
              </span>
              <p className="font-headline font-bold text-on-surface">{c.value}</p>
            </div>
          </a>
        ))}
      </div>

      <section className="hyper-glass mt-8 rounded-2xl p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface">Antes de escribir</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-body-md text-on-surface-variant/90">
          <li>Ten a la mano el número de tu pedido.</li>
          <li>Si tu pago aparece pendiente, espera la confirmación de Mercado Pago.</li>
          <li>Los códigos entregados se ven en “Mi cuenta → Órdenes”.</li>
        </ul>
      </section>
    </div>
  )
}
