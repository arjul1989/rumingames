import ShaderBackground from "@modules/gorumin/components/shader-background"
import CrystalToken from "@modules/gorumin/components/crystal-token"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Home hero (US-7.2 / RUM-38): liquid neon background, floating crystal token
// and the primary call to action into the store.
export default function HomeHero() {
  return (
    <section className="relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground className="h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        <div className="scanline pointer-events-none absolute left-0 h-px w-full animate-scan bg-secondary/20" />
      </div>

      {/* Crystal token */}
      <div className="relative z-10 -mb-10 mt-20 md:-mb-20">
        <CrystalToken />
      </div>

      {/* Call to action */}
      <div className="relative z-20 flex animate-fade-in-up flex-col items-center space-y-8 px-margin-mobile text-center">
        <div className="space-y-3">
          <p className="font-mono text-label-caps tracking-[0.4em] text-secondary">
            COMUNIDAD GAMER · COLOMBIA
          </p>
          <h1 className="hero-gradient-text font-display text-4xl font-extrabold leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:text-7xl">
            RECARGA TU JUEGO
          </h1>
          <p className="mx-auto max-w-xl text-body-md text-on-surface-variant/80">
            Gift cards y recargas digitales con entrega inmediata. Steam,
            PlayStation, Riot, Xbox y más.
          </p>
        </div>

        <LocalizedClientLink
          href="/store"
          className="brutalist-button group relative overflow-hidden bg-primary px-12 py-5 font-mono text-base tracking-widest text-on-primary shadow-[0_0_40px_rgba(221,183,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">EXPLORAR TIENDA</span>
          <div className="shimmer-overlay absolute inset-0 animate-shimmer opacity-30" />
        </LocalizedClientLink>
      </div>
    </section>
  )
}
