import type { Streamer } from "@lib/data/cms"
import StreamerDirectoryItem from "@modules/gorumin/components/streamer-directory-item"
import StreamerSpotlight from "@modules/gorumin/components/streamer-spotlight"

export default function StreamerDirectory({
  streamers,
}: {
  streamers: Streamer[]
}) {
  const sorted = [...streamers].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  )

  return (
    <div className="space-y-10">
      <StreamerSpotlight streamers={streamers} />

      <section className="space-y-3">
        <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/50">
          Directorio
        </h2>
        <div className="flex flex-col gap-2">
          {sorted.map((streamer, index) => (
            <StreamerDirectoryItem
              key={streamer.id}
              streamer={streamer}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
