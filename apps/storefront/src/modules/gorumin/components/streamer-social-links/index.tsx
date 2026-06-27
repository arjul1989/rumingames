function channelLabel(url: string, platform: "twitch" | "youtube"): string {
  try {
    const { pathname } = new URL(url)
    if (platform === "twitch") {
      const handle = pathname.replace(/^\//, "").split("/")[0]
      return handle ? `@${handle}` : "Twitch"
    }
    if (pathname.startsWith("/@")) return pathname.slice(1)
    if (pathname.includes("/channel/")) {
      const id = pathname.split("/channel/")[1]?.split("/")[0]
      return id ? `@${id}` : "YouTube"
    }
    if (pathname.includes("/c/")) {
      const slug = pathname.split("/c/")[1]?.split("/")[0]
      return slug ? `@${slug}` : "YouTube"
    }
    return "YouTube"
  } catch {
    return platform === "twitch" ? "Twitch" : "YouTube"
  }
}

export default function StreamerSocialLinks({
  twitch_url,
  youtube_url,
  variant = "default",
  centered = false,
}: {
  twitch_url: string | null
  youtube_url: string | null
  variant?: "default" | "minimal"
  centered?: boolean
}) {
  if (!twitch_url && !youtube_url) return null

  if (variant === "minimal") {
    return (
      <div
        className={`flex flex-wrap gap-x-4 gap-y-1 ${centered ? "justify-center" : ""}`}
      >
        {twitch_url && (
          <a
            href={twitch_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-on-surface-variant/70 transition-colors hover:text-secondary"
          >
            Twitch · {channelLabel(twitch_url, "twitch")}
          </a>
        )}
        {youtube_url && (
          <a
            href={youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-on-surface-variant/70 transition-colors hover:text-secondary"
          >
            YouTube · {channelLabel(youtube_url, "youtube")}
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {twitch_url && (
        <a
          href={twitch_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs tracking-wide text-on-surface-variant transition-colors hover:border-white/20 hover:text-on-surface"
          aria-label={`Ver ${channelLabel(twitch_url, "twitch")} en Twitch`}
        >
          Twitch
          <span className="text-on-surface-variant/50">
            {channelLabel(twitch_url, "twitch")}
          </span>
        </a>
      )}
      {youtube_url && (
        <a
          href={youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs tracking-wide text-on-surface-variant transition-colors hover:border-white/20 hover:text-on-surface"
          aria-label={`Ver ${channelLabel(youtube_url, "youtube")} en YouTube`}
        >
          YouTube
          <span className="text-on-surface-variant/50">
            {channelLabel(youtube_url, "youtube")}
          </span>
        </a>
      )}
    </div>
  )
}
