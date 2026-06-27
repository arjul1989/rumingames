import Image from "next/image"
import type { Streamer } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function StreamerRail({
  streamers,
}: {
  streamers: Streamer[]
}) {
  if (!streamers.length) return null

  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto pb-2">
      {streamers.map((streamer) => (
        <LocalizedClientLink
          key={streamer.id}
          href={`/streamers/${streamer.slug}`}
          className="group flex w-16 shrink-0 flex-col items-center gap-2"
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-surface-container ring-1 ring-white/10 transition-all group-hover:ring-secondary/40">
            {streamer.avatar ? (
              <Image
                src={streamer.avatar}
                alt={streamer.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-on-surface-variant/40">
                person
              </span>
            )}
          </div>
          <span className="max-w-[4.5rem] truncate text-center font-mono text-[10px] text-on-surface-variant/60 group-hover:text-on-surface">
            {streamer.name}
          </span>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
