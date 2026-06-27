#!/usr/bin/env node
/**
 * Build realistic platform gift-card images using official brand logos.
 * Usage: node assets/brand/platforms/scripts/build-cards.mjs
 */
import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const LOGOS = join(ROOT, "logos")
const OUT = join(ROOT, "png")
const PUBLIC = join(
  ROOT,
  "..",
  "..",
  "..",
  "apps",
  "storefront",
  "public",
  "platforms"
)

const PLATFORMS = [
  {
    id: "steam",
    logo: "steam-icon.svg",
    logoW: 220,
    logoH: 220,
    logoY: 118,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#0e1419"/>
          <stop offset="0.5" stop-color="#1b2838"/>
          <stop offset="1" stop-color="#2a475e"/>
        </linearGradient>
        <radialGradient id="shine" cx="30%" cy="20%" r="70%">
          <stop stop-color="#ffffff" stop-opacity="0.12"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
      <rect width="400" height="400" rx="20" fill="url(#shine)"/>
    `,
  },
  {
    id: "playstation",
    logo: "playstation.svg",
    logoW: 180,
    logoH: 180,
    logoY: 95,
    extra: `
      <text x="200" y="310" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="6">STORE</text>
    `,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#001a5c"/>
          <stop offset="1" stop-color="#0070d1"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
    `,
  },
  {
    id: "xbox",
    logo: "xbox-white.svg",
    logoW: 220,
    logoH: 220,
    logoY: 90,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#0b5c0b"/>
          <stop offset="1" stop-color="#107c10"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
    `,
  },
  {
    id: "nintendo",
    logo: "nintendo-white.svg",
    logoW: 288,
    logoH: 96,
    logoY: 118,
    extra: `
      <text x="200" y="248" text-anchor="middle" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600" letter-spacing="4" opacity="0.9">eShop</text>
    `,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#c4000f"/>
          <stop offset="1" stop-color="#e60012"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
    `,
  },
  {
    id: "riot",
    logo: "riotgames.svg",
    logoW: 240,
    logoH: 240,
    logoY: 110,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#111118"/>
          <stop offset="1" stop-color="#d13639"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
      <path d="M0 320 L400 260 L400 400 L0 400 Z" fill="#000000" fill-opacity="0.25"/>
    `,
  },
  {
    id: "free-fire",
    logo: "free-fire-white.svg",
    logoW: 300,
    logoH: 42,
    logoY: 179,
    bg: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="400" y2="400">
          <stop stop-color="#1a0800"/>
          <stop offset="0.35" stop-color="#cc4400"/>
          <stop offset="0.7" stop-color="#ff7700"/>
          <stop offset="1" stop-color="#ffaa00"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
    `,
  },
]

function logoDataUri(filename) {
  const raw = readFileSync(join(LOGOS, filename), "utf8")
  const b64 = Buffer.from(raw).toString("base64")
  return `data:image/svg+xml;base64,${b64}`
}

function buildCard(platform) {
  const x = (400 - platform.logoW) / 2
  const href = logoDataUri(platform.logo)
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" role="img" aria-label="${platform.id}">
  ${platform.bg}
  <image xlink:href="${href}" x="${x}" y="${platform.logoY}" width="${platform.logoW}" height="${platform.logoH}" preserveAspectRatio="xMidYMid meet"/>
  ${platform.extra ?? ""}
</svg>`
}

function renderSvg(svg, output, size) {
  const tmp = output.replace(/\.png$/, ".svg")
  writeFileSync(tmp, svg)
  execFileSync(
    "npx",
    ["--yes", "@resvg/resvg-js-cli", tmp, output, "--fit-width", String(size), "--fit-height", String(size)],
    { stdio: "inherit" }
  )
}

mkdirSync(OUT, { recursive: true })
mkdirSync(PUBLIC, { recursive: true })

console.log("Building platform gift-card images…")
for (const platform of PLATFORMS) {
  const svg = buildCard(platform)
  const png512 = join(OUT, `${platform.id}-512.png`)
  const pngPublic = join(PUBLIC, `${platform.id}.png`)
  renderSvg(svg, png512, 512)
  copyFileSync(png512, pngPublic)
  console.log(`  ✓ ${platform.id}.png`)
}

console.log("Done.")
