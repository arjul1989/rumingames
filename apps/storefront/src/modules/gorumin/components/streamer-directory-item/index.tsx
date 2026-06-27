import Image from "next/image"
import type { Streamer } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StreamerSocialLinks from "@modules/gorumin/components/streamer-social-links"

export default function StreamerDirectoryItem({
  streamer,
  index,
}: {
  streamer: Streamer
  index: number
}) {
  return (
    <article className="group flex items-center gap-4 rounded-xl border border-white/5 bg-surface-container/15 px-4 py-4 transition-all duration-300 hover:border-primary/25 hover:bg-surface-container/30 sm:gap-5 sm:px-5 sm:py-5">
      <span
        aria-hidden
        className="hidden w-7 shrink-0 font-mono text-lg font-bold tabular-nums text-white/[0.06] transition-colors group-hover:text-primary/20 sm:block"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <LocalizedClientLink
        href={`/streamers/${streamer.slug}`}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-container ring-1 ring-white/10 transition-all hover:ring-secondary/30 sm:h-16 sm:w-16"
      >
        {streamer.avatar ? (
          <Image
            src={streamer.avatar}
            alt={streamer.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-on-surface-variant/40">
            person
          </span>
        )}
      </LocalizedClientLink>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LocalizedClientLink
            href={`/streamers/${streamer.slug}`}
            className="truncate font-headline text-base font-semibold text-on-surface transition-colors hover:text-secondary sm:text-lg"
          >
            {streamer.name}
          </LocalizedClientLink>
          {streamer.is_featured && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] tracking-wider text-primary">
              DESTACADO
            </span>
          )}
        </div>
        {streamer.bio && (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-on-surface-variant/65">
            {streamer.bio}
          </p>
        )}
        <div className="mt-2 md:hidden">
          <StreamerSocialLinks
            twitch_url={streamer.twitch_url}
            youtube_url={streamer.youtube_url}
            variant="minimal"
          />
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
        <StreamerSocialLinks
          twitch_url={streamer.twitch_url}
          youtube_url={streamer.youtube_url}
          variant="minimal"
        />
        <LocalizedClientLink
          href={`/streamers/${streamer.slug}`}
          className="material-symbols-outlined text-lg text-on-surface-variant/30 transition-all hover:translate-x-0.5 hover:text-secondary"
          aria-label={`Ver perfil de ${streamer.name}`}
        >
          arrow_forward
        </LocalizedClientLink>
      </div>

      <LocalizedClientLink
        href={`/streamers/${streamer.slug}`}
        className="material-symbols-outlined shrink-0 text-on-surface-variant/30 transition-colors hover:text-secondary md:hidden"
        aria-label={`Ver perfil de ${streamer.name}`}
      >
        chevron_right
      </LocalizedClientLink>
    </article>
  )
}
