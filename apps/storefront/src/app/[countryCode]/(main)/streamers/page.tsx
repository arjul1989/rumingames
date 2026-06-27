import { Metadata } from "next"

import { listStreamers } from "@lib/data/cms"
import { localizedAlternates, SITE_NAME } from "@lib/seo"
import StreamerDirectory from "@modules/gorumin/components/streamer-directory"

export const metadata: Metadata = {
  title: "Streamers",
  description:
    `Conoce a los streamers e influencers de la comunidad gamer de ${SITE_NAME} Colombia.`,
  alternates: localizedAlternates("streamers"),
}

export default async function StreamersPage() {
  const { streamers } = await listStreamers({ limit: 60 })

  return (
    <div className="content-container py-16">
      <header className="mb-12 max-w-2xl space-y-3">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">
          COMUNIDAD
        </p>
        <h1 className="font-display text-4xl font-extrabold text-on-surface md:text-5xl">
          Streamers
        </h1>
        <p className="text-sm leading-relaxed text-on-surface-variant/60">
          Creadores de la comunidad gamer en Colombia. Sigue sus canales en
          Twitch y YouTube.
        </p>
      </header>

      {streamers.length ? (
        <StreamerDirectory streamers={streamers} />
      ) : (
        <p className="text-on-surface-variant/70">
          Aún no hay streamers en la comunidad. Vuelve pronto.
        </p>
      )}
    </div>
  )
}
