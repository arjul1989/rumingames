import Image from "next/image"
import type { Streamer } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function StreamerSpotlight({
  streamers,
}: {
  streamers: Streamer[]
}) {
  const featured = streamers.filter((s) => s.is_featured)
  if (!featured.length) return null

  return (
    <section className="mb-14">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-label-caps tracking-widest text-secondary">
          Destacados
        </h2>
        <p className="font-mono text-[10px] tracking-widest text-on-surface-variant/40">
          DESLIZA →
        </p>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {featured.map((streamer) => (
          <LocalizedClientLink
            key={streamer.id}
            href={`/streamers/${streamer.slug}`}
            className="group snap-start flex w-[7.5rem] shrink-0 flex-col items-center gap-3"
          >
            <div className="rounded-full bg-gradient-to-tr from-primary/80 via-secondary/60 to-primary/80 p-[2px] transition-transform duration-300 group-hover:scale-105">
              <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border-2 border-background bg-surface-container">
                {streamer.avatar ? (
                  <Image
                    src={streamer.avatar}
                    alt={streamer.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-on-surface-variant/40">
                    person
                  </span>
                )}
              </div>
            </div>
            <span className="max-w-full truncate text-center font-headline text-sm font-semibold text-on-surface group-hover:text-secondary">
              {streamer.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
