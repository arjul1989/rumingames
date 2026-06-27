#!/usr/bin/env node
/**
 * Gorumin-styled platform card SVGs — purple rim, cyan accent, hyper-glass feel.
 * Preview only until approved. Usage: node assets/brand/platforms/scripts/build-gorumin-cards.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const LOGOS = join(ROOT, "logos")
const OUT = join(ROOT, "gorumin")
const PREVIEW = join(ROOT, "preview")
const PUBLIC_PREVIEW = join(
  ROOT,
  "..",
  "..",
  "..",
  "apps",
  "storefront",
  "public",
  "platforms",
  "preview"
)

const PLATFORMS = [
  {
    id: "steam",
    label: "Steam Gift Card",
    logo: "steam-icon.svg",
    logoW: 200,
    logoH: 200,
    logoY: 128,
    bg: `
      <linearGradient id="bg-steam" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#0a1018"/>
        <stop offset="0.45" stop-color="#1b2838"/>
        <stop offset="1" stop-color="#2a475e"/>
      </linearGradient>
      <radialGradient id="shine-steam" cx="25%" cy="15%" r="65%">
        <stop stop-color="#4cd7f6" stop-opacity="0.08"/>
        <stop offset="1" stop-color="#4cd7f6" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-steam)`,
    shine: `url(#shine-steam)`,
  },
  {
    id: "playstation",
    label: "PlayStation Store Gift Card",
    logo: "playstation.svg",
    logoW: 160,
    logoH: 160,
    logoY: 108,
    extra: `<text x="200" y="300" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="7">STORE</text>`,
    bg: `
      <linearGradient id="bg-playstation" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#000d3a"/>
        <stop offset="0.6" stop-color="#003791"/>
        <stop offset="1" stop-color="#0070d1"/>
      </linearGradient>
      <radialGradient id="shine-playstation" cx="80%" cy="10%" r="50%">
        <stop stop-color="#ddb7ff" stop-opacity="0.12"/>
        <stop offset="1" stop-color="#ddb7ff" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-playstation)`,
    shine: `url(#shine-playstation)`,
  },
  {
    id: "xbox",
    label: "Xbox Game Pass Ultimate",
    logo: "xbox-white.svg",
    logoW: 200,
    logoH: 200,
    logoY: 108,
    bg: `
      <linearGradient id="bg-xbox" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#052805"/>
        <stop offset="0.5" stop-color="#0b6b0b"/>
        <stop offset="1" stop-color="#107c10"/>
      </linearGradient>
      <radialGradient id="shine-xbox" cx="75%" cy="20%" r="55%">
        <stop stop-color="#ffffff" stop-opacity="0.14"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-xbox)`,
    shine: `url(#shine-xbox)`,
  },
  {
    id: "nintendo",
    label: "Nintendo eShop Gift Card",
    logo: "nintendo-white.svg",
    logoW: 288,
    logoH: 96,
    logoY: 118,
    extra: `<text x="200" y="248" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, Arial, sans-serif" font-size="22" font-weight="600" letter-spacing="4" opacity="0.92">eShop</text>`,
    bg: `
      <linearGradient id="bg-nintendo" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#8f0009"/>
        <stop offset="0.5" stop-color="#c4000f"/>
        <stop offset="1" stop-color="#e60012"/>
      </linearGradient>
      <radialGradient id="shine-nintendo" cx="20%" cy="80%" r="60%">
        <stop stop-color="#ddb7ff" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#ddb7ff" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-nintendo)`,
    shine: `url(#shine-nintendo)`,
  },
  {
    id: "riot",
    label: "Riot Points (Valorant / LoL)",
    logo: "riotgames.svg",
    logoW: 220,
    logoH: 220,
    logoY: 118,
    bg: `
      <linearGradient id="bg-riot" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#0c0c12"/>
        <stop offset="0.55" stop-color="#1a1a24"/>
        <stop offset="1" stop-color="#d13639"/>
      </linearGradient>
      <radialGradient id="shine-riot" cx="90%" cy="90%" r="45%">
        <stop stop-color="#d13639" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#d13639" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-riot)`,
    shine: `url(#shine-riot)`,
  },
  {
    id: "free-fire",
    label: "Free Fire Diamantes",
    logo: "free-fire-white.svg",
    logoW: 280,
    logoH: 40,
    logoY: 186,
    bg: `
      <linearGradient id="bg-free-fire" x1="0" y1="0" x2="400" y2="400">
        <stop stop-color="#140600"/>
        <stop offset="0.3" stop-color="#993300"/>
        <stop offset="0.65" stop-color="#ff6600"/>
        <stop offset="1" stop-color="#ffaa00"/>
      </linearGradient>
      <radialGradient id="shine-free-fire" cx="15%" cy="25%" r="55%">
        <stop stop-color="#4cd7f6" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#4cd7f6" stop-opacity="0"/>
      </radialGradient>`,
    fill: `url(#bg-free-fire)`,
    shine: `url(#shine-free-fire)`,
  },
]

function logoDataUri(filename) {
  const raw = readFileSync(join(LOGOS, filename), "utf8")
  return `data:image/svg+xml;base64,${Buffer.from(raw).toString("base64")}`
}

function buildGoruminCard(platform) {
  const x = (400 - platform.logoW) / 2
  const href = logoDataUri(platform.logo)
  const pid = platform.id

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" role="img" aria-label="${platform.label}">
  <defs>
    ${platform.bg}
    <linearGradient id="frame-${pid}" x1="0" y1="0" x2="400" y2="400">
      <stop stop-color="#ddb7ff" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#4d4354" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#4cd7f6" stop-opacity="0.25"/>
    </linearGradient>
    <filter id="glow-${pid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="clip-${pid}"><rect width="400" height="400" rx="28"/></clipPath>
  </defs>

  <!-- Gorumin dark base -->
  <rect width="400" height="400" rx="28" fill="#0b1326"/>

  <g clip-path="url(#clip-${pid})">
    <rect width="400" height="400" fill="${platform.fill}"/>
    <rect width="400" height="400" fill="${platform.shine}"/>
    <ellipse cx="200" cy="390" rx="170" ry="50" fill="#b76dff" fill-opacity="0.1"/>
    <image xlink:href="${href}" x="${x}" y="${platform.logoY}" width="${platform.logoW}" height="${platform.logoH}" preserveAspectRatio="xMidYMid meet"/>
    ${platform.extra ?? ""}
  </g>

  <!-- Hyper-glass rim -->
  <rect x="1.5" y="1.5" width="397" height="397" rx="26.5" fill="none" stroke="url(#frame-${pid})" stroke-width="2"/>
  <rect x="10" y="10" width="380" height="380" rx="22" fill="none" stroke="#ddb7ff" stroke-opacity="0.08" stroke-width="1"/>

  <!-- Gorumin cyan accent (matches app icon) -->
  <circle cx="348" cy="52" r="16" fill="#4cd7f6" fill-opacity="0.18"/>
  <circle cx="348" cy="52" r="7" fill="#4cd7f6" filter="url(#glow-${pid})"/>
</svg>`
}

mkdirSync(OUT, { recursive: true })
mkdirSync(PREVIEW, { recursive: true })
mkdirSync(PUBLIC_PREVIEW, { recursive: true })

const manifest = []

for (const platform of PLATFORMS) {
  const svg = buildGoruminCard(platform)
  const outPath = join(OUT, `${platform.id}.svg`)
  writeFileSync(outPath, svg)
  copyFileSync(outPath, join(PUBLIC_PREVIEW, `${platform.id}.svg`))
  manifest.push(platform)
  console.log(`  ✓ gorumin/${platform.id}.svg`)
}

const previewHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Gorumin — Preview tarjetas plataforma</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0b1326;
      color: #e8e0f0;
      padding: 2rem;
      min-height: 100vh;
    }
    h1 {
      font-size: 1.75rem;
      background: linear-gradient(135deg, #ddb7ff, #4cd7f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.25rem;
    }
    .sub { color: #9a8faa; font-size: 0.9rem; margin-bottom: 2rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    .card {
      background: rgba(19, 27, 46, 0.6);
      border: 1px solid rgba(221, 183, 255, 0.12);
      border-radius: 16px;
      padding: 1.25rem;
    }
    .card h2 { font-size: 0.7rem; letter-spacing: 0.15em; color: #4cd7f6; margin-bottom: 0.75rem; text-transform: uppercase; }
    .card h3 { font-size: 1rem; margin-bottom: 1rem; color: #ddb7ff; }
    .compare { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .compare > div { text-align: center; }
    .compare img, .compare object {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 12px;
      object-fit: cover;
      background: #131b2e;
    }
    .label { font-size: 0.65rem; letter-spacing: 0.1em; color: #6b6080; margin-top: 0.4rem; text-transform: uppercase; }
    .badge {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      background: rgba(76, 215, 246, 0.1);
      border: 1px solid rgba(76, 215, 246, 0.3);
      color: #4cd7f6;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <h1>Preview — Tarjetas plataforma Gorumin</h1>
  <p class="sub">Comparación: actual (PNG) vs propuesta SVG con toque Gorumin. Sin cambios en producción hasta aprobación.</p>
  <div class="grid">
${manifest
  .map(
    (p) => `    <div class="card">
      <h2>${p.id.replace("-", " ")}</h2>
      <h3>${p.label}</h3>
      <div class="compare">
        <div>
          <img src="/platforms/${p.id}.png" alt="Actual ${p.id}"/>
          <div class="label">Actual (PNG)</div>
        </div>
        <div>
          <object type="image/svg+xml" data="/platforms/preview/${p.id}.svg" aria-label="Propuesta ${p.id}"></object>
          <div class="label">Propuesta (SVG Gorumin)</div>
        </div>
      </div>
    </div>`
  )
  .join("\n")}
  </div>
  <p class="badge">Toque Gorumin: borde hyper-glass púrpura/cyan · punto cyan · glow inferior · logos oficiales</p>
</body>
</html>`

writeFileSync(join(PREVIEW, "index.html"), previewHtml)
copyFileSync(join(PREVIEW, "index.html"), join(PUBLIC_PREVIEW, "index.html"))

// Also write local-file-friendly preview for assets folder
const localPreviewHtml = previewHtml
  .replaceAll('src="/platforms/', 'src="../../../apps/storefront/public/platforms/')
  .replaceAll('data="/platforms/preview/', 'data="../gorumin/')
writeFileSync(join(PREVIEW, "index-local.html"), localPreviewHtml)

console.log("\\nPreview: open assets/brand/platforms/preview/index.html")
console.log("Or visit: http://localhost:8000/platforms/preview/index.html (when storefront is running)")
