import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Gorumin global footer (US-7.1 / RUM-37). Community + store + legal links and
// the active country (Colombia in the MVP).
const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "TIENDA",
    links: [
      { href: "/store", label: "Gift Cards" },
      { href: "/store", label: "Recargas" },
      { href: "/store", label: "Suscripciones" },
    ],
  },
  {
    title: "COMUNIDAD",
    links: [
      { href: "/noticias", label: "Noticias" },
      { href: "/streamers", label: "Streamers" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { href: "/terminos", label: "Términos" },
      { href: "/privacidad", label: "Privacidad" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
]

export default async function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-gradient-to-t from-surface-dim to-transparent">
      <div className="content-container flex flex-col py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="space-y-3">
            <LocalizedClientLink
              href="/"
              className="font-display text-3xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(221,183,255,0.5)]"
            >
              GORUMIN
            </LocalizedClientLink>
            <p className="max-w-xs text-sm text-on-surface-variant/70">
              Gift cards y recargas de videojuegos para la comunidad gamer de
              Colombia.
            </p>
            <p className="font-mono text-label-caps tracking-widest text-secondary">
              🇨🇴 COLOMBIA · COP
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-y-3">
                <span className="font-mono text-label-caps tracking-widest text-on-surface">
                  {col.title}
                </span>
                <ul className="flex flex-col gap-y-2">
                  {col.links.map((link, i) => (
                    <li key={`${link.href}-${i}`}>
                      <LocalizedClientLink
                        href={link.href}
                        className="text-sm text-on-surface-variant/70 transition-colors hover:text-secondary"
                      >
                        {link.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6">
          <p className="font-mono text-xs text-on-surface-variant/40">
            © {new Date().getFullYear()} Gorumin — rumingames. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
