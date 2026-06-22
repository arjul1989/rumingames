import { getBaseURL } from "@lib/util/env"
import { openGraphBase, SITE_NAME } from "@lib/seo"
import { Metadata } from "next"
import { Sora, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"
import "styles/globals.css"

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-sora",
  display: "swap",
})

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-hanken",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
})

const DEFAULT_TITLE = `${SITE_NAME} — Gift cards y recargas de videojuegos en Colombia`
const DEFAULT_DESCRIPTION =
  "Compra gift cards y recargas de Steam, PlayStation, Riot, Xbox y más con entrega digital inmediata. Noticias y streamers de la comunidad gamer colombiana."

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "gift cards",
    "recargas",
    "videojuegos",
    "gaming",
    "Steam",
    "PlayStation",
    "Riot",
    "Xbox",
    "Colombia",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    ...openGraphBase(),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      data-mode="dark"
      className={`dark ${sora.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
        />
      </head>
      <body className="font-body bg-background text-on-background antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
