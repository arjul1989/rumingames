import { getBaseURL } from "@lib/util/env"
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

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      data-mode="dark"
      className={`dark ${sora.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <head>
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
