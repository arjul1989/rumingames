import Image from "next/image"
import type { Streamer } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Horizontal "story circle" rail of community streamers (US-7.2 / US-7.4).
export default function StreamerRail({
  streamers,
}: {
  streamers: Streamer[]
}) {
  if (!streamers.length) return null

  return (
    <div className="no-scrollbar flex gap-gutter overflow-x-auto pb-4">
      {streamers.map((streamer) => (
        <LocalizedClientLink
          key={streamer.id}
          href={`/streamers/${streamer.slug}`}
          className="group flex flex-shrink-0 flex-col items-center gap-2"
        >
          <div
            className={
              streamer.is_featured
                ? "h-20 w-20 rounded-full bg-gradient-to-tr from-primary via-secondary to-primary p-[3px]"
                : "h-20 w-20 rounded-full bg-white/10 p-[3px]"
            }
          >
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background">
              {streamer.avatar ? (
                <Image
                  src={streamer.avatar}
                  alt={streamer.name}
                  fill
                  sizes="80px"
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
          </div>
          <span className="max-w-[80px] truncate font-mono text-[10px] tracking-wide text-on-surface-variant group-hover:text-primary">
            {streamer.name}
          </span>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
