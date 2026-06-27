import type { FeaturedGameDetail } from "@lib/data/cms"
import ShaderBackground from "@modules/gorumin/components/shader-background"
import FeaturedGameCard from "@modules/gorumin/components/featured-game-card"

function gridClass(count: number): string {
  if (count === 1) return "grid-cols-1 max-w-4xl mx-auto"
  if (count === 2) return "grid-cols-1 md:grid-cols-2"
  return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
}

// Home hero replacement: up to 3 featured games with buy CTAs.
export default function FeaturedGamesHero({
  games,
}: {
  games: FeaturedGameDetail[]
}) {
  if (!games.length) return null

  const count = games.length

  return (
    <section className="relative w-full overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 z-0">
        <ShaderBackground className="h-full w-full opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="scanline pointer-events-none absolute left-0 h-px w-full animate-scan bg-secondary/20" />
      </div>

      <div className="content-container relative z-10 space-y-10">
        <header className="space-y-2 text-center md:text-left">
          <p className="font-mono text-label-caps tracking-[0.4em] text-secondary">
            VIDEOJUEGOS DESTACADOS
          </p>
          <h1 className="hero-gradient-text font-display text-4xl font-extrabold md:text-5xl">
            LO NUEVO PARA JUGAR
          </h1>
          <p className="mx-auto max-w-2xl text-body-md text-on-surface-variant/80 md:mx-0">
            Gift cards y recargas de los lanzamientos y plataformas del momento.
            Entrega digital inmediata.
          </p>
        </header>

        <div className={`grid gap-gutter ${gridClass(count)}`}>
          {games.map((game) => (
            <FeaturedGameCard
              key={game.id}
              game={game}
              featured={count === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
