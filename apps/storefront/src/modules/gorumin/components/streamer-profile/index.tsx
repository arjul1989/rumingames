import Image from "next/image"
import type { Streamer } from "@lib/data/cms"
import StreamerSocialLinks from "@modules/gorumin/components/streamer-social-links"

export default function StreamerProfile({ streamer }: { streamer: Streamer }) {
  return (
    <header className="max-w-2xl space-y-6 border-b border-white/10 pb-8">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-container">
          {streamer.avatar ? (
            <Image
              src={streamer.avatar}
              alt={streamer.name}
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          ) : (
            <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-on-surface-variant/40">
              person
            </span>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-on-surface sm:text-3xl">
            {streamer.name}
          </h1>
          {streamer.is_featured && (
            <p className="mt-0.5 font-mono text-[10px] tracking-wider text-secondary/80">
              Destacado
            </p>
          )}
        </div>
      </div>

      {streamer.bio && (
        <p className="text-base leading-relaxed text-on-surface-variant/75">
          {streamer.bio}
        </p>
      )}

      <StreamerSocialLinks
        twitch_url={streamer.twitch_url}
        youtube_url={streamer.youtube_url}
        variant="minimal"
      />
    </header>
  )
}
