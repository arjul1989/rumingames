import { Metadata } from "next"
import Image from "next/image"

import { listStreamers } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Streamers — Gorumin",
  description:
    "Conoce a los streamers e influencers de la comunidad gamer de Gorumin Colombia.",
}

// Streamer directory (US-7.4 / RUM-40).
export default async function StreamersPage() {
  const { streamers } = await listStreamers({ limit: 60 })

  return (
    <div className="content-container py-16">
      <header className="mb-12 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">
          COMUNIDAD
        </p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Streamers
        </h1>
      </header>

      {streamers.length ? (
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {streamers.map((streamer) => (
            <LocalizedClientLink
              key={streamer.id}
              href={`/streamers/${streamer.slug}`}
              className="hyper-glass group flex items-center gap-4 rounded-xl p-5 transition-all duration-500 hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
                {streamer.avatar ? (
                  <Image
                    src={streamer.avatar}
                    alt={streamer.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-container">
                    <span className="material-symbols-outlined text-on-surface-variant/50">
                      person
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline truncate text-lg font-bold text-on-surface">
                    {streamer.name}
                  </h2>
                  {streamer.is_featured && (
                    <span className="rounded-full bg-primary/90 px-2 py-0.5 font-mono text-[9px] tracking-widest text-on-primary">
                      DESTACADO
                    </span>
                  )}
                </div>
                {streamer.bio && (
                  <p className="mt-1 text-sm text-on-surface-variant/70 line-clamp-2">
                    {streamer.bio}
                  </p>
                )}
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant/70">
          Aún no hay streamers en la comunidad. Vuelve pronto.
        </p>
      )}
    </div>
  )
}
