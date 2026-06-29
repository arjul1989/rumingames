import type { FeaturedGameDetail } from "@lib/data/cms"
import ShaderBackground from "@modules/gorumin/components/shader-background"
import FeaturedGameCard from "@modules/gorumin/components/featured-game-card"
import AutoCarousel from "@modules/gorumin/components/auto-carousel"

// Home hero: full-width auto carousel with up to 3 featured games.
export default function FeaturedGamesHero({
  games,
}: {
  games: FeaturedGameDetail[]
}) {
  if (!games.length) return null

  return (
    <section className="relative w-full overflow-hidden py-12 md:py-20">
      <div className="absolute inset-0 z-0">
        <ShaderBackground className="h-full w-full opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="scanline pointer-events-none absolute left-0 h-px w-full animate-scan bg-secondary/20" />
      </div>

      <div className="content-container relative z-10 space-y-8">
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

        <AutoCarousel
          aria-label="Videojuegos destacados"
          intervalMs={6500}
        >
          {games.map((game, i) => (
            <FeaturedGameCard key={game.id} game={game} priority={i === 0} />
          ))}
        </AutoCarousel>
      </div>
    </section>
  )
}
