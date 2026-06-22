// Floating "tech-crystal" token for the home hero (Stitch design). Implemented
// as an animated SVG octahedron with neon glow instead of a WebGL/Three.js
// scene, to keep the bundle light while preserving the look. Decorative only.
export default function CrystalToken({
  className = "",
}: {
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex items-center justify-center ${className}`}
    >
      <div className="relative animate-float">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute inset-0 -z-10 translate-x-10 translate-y-10 scale-125 rounded-full bg-secondary/20 blur-3xl" />

        {/* Rotating wireframe shell */}
        <svg
          className="absolute inset-0 h-full w-full animate-spin-slow [animation-direction:reverse]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon
            points="100,8 192,100 100,192 8,100"
            stroke="#4cd7f6"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <line x1="100" y1="8" x2="100" y2="192" stroke="#4cd7f6" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="8" y1="100" x2="192" y2="100" stroke="#4cd7f6" strokeOpacity="0.2" strokeWidth="1" />
        </svg>

        {/* Core gem */}
        <svg
          className="h-56 w-56 animate-spin-slow drop-shadow-[0_0_40px_rgba(221,183,255,0.45)] md:h-80 md:w-80"
          viewBox="0 0 200 200"
        >
          <defs>
            <linearGradient id="gem-face-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ddb7ff" />
              <stop offset="100%" stopColor="#842bd2" />
            </linearGradient>
            <linearGradient id="gem-face-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b76dff" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            <linearGradient id="gem-face-c" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#4cd7f6" />
              <stop offset="100%" stopColor="#842bd2" />
            </linearGradient>
          </defs>
          {/* Octahedron facets */}
          <polygon points="100,20 100,100 30,100" fill="url(#gem-face-a)" opacity="0.9" />
          <polygon points="100,20 100,100 170,100" fill="url(#gem-face-b)" opacity="0.85" />
          <polygon points="100,180 100,100 30,100" fill="url(#gem-face-c)" opacity="0.8" />
          <polygon points="100,180 100,100 170,100" fill="url(#gem-face-a)" opacity="0.75" />
          <polygon
            points="100,20 170,100 100,180 30,100"
            fill="none"
            stroke="#f0dbff"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  )
}
