#!/usr/bin/env node
/**
 * Export Gorumin brand SVGs to PNG sizes for favicons and future use.
 * Usage: node assets/brand/gorumin/scripts/export.mjs
 */
import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SVG_ICON = join(ROOT, "svg", "icon.svg")
const SVG_LOGO = join(ROOT, "svg", "logo.svg")
const PNG_ICON = join(ROOT, "png", "icon")
const PNG_LOGO = join(ROOT, "png", "logo")
const STOREFRONT_APP = join(
  ROOT,
  "..",
  "..",
  "..",
  "apps",
  "storefront",
  "src",
  "app"
)

const ICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 512]
const LOGO_WIDTHS = [256, 512, 1024]

function renderSvg(input, output, width, height) {
  const args = [input, output, "--fit-width", String(width)]
  if (height) args.push("--fit-height", String(height))
  execFileSync("npx", ["--yes", "@resvg/resvg-js-cli", ...args], {
    stdio: "inherit",
  })
}

mkdirSync(PNG_ICON, { recursive: true })
mkdirSync(PNG_LOGO, { recursive: true })
mkdirSync(STOREFRONT_APP, { recursive: true })

console.log("Exporting icon PNGs…")
for (const size of ICON_SIZES) {
  renderSvg(SVG_ICON, join(PNG_ICON, `${size}.png`), size, size)
}

console.log("Exporting logo PNGs…")
for (const width of LOGO_WIDTHS) {
  renderSvg(SVG_LOGO, join(PNG_LOGO, `${width}.png`), width)
}

console.log("Installing storefront favicon…")
writeFileSync(join(STOREFRONT_APP, "icon.svg"), readFileSync(SVG_ICON))
copyFileSync(join(PNG_ICON, "32.png"), join(STOREFRONT_APP, "icon.png"))
copyFileSync(join(PNG_ICON, "180.png"), join(STOREFRONT_APP, "apple-icon.png"))

console.log("Done.")
