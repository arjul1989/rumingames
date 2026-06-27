const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Mercado Pago Payment Brick — SDK, secure fields (cards), PSE (CO), analytics.
const MP_ORIGINS = [
  "https://sdk.mercadopago.com",
  "https://www.mercadopago.com",
  "https://www.mercadopago.com.co",
  "https://mercadopago.com.co",
  "https://api.mercadopago.com",
  "https://events.mercadopago.com",
  "https://http2.mlstatic.com",
  "https://secure.mlstatic.com",
  "https://*.mlstatic.com",
  "https://*.mercadopago.com",
  "https://*.mercadopago.com.co",
  "https://www.mercadolibre.com",
  "https://*.mercadolibre.com",
].join(" ")

const STRIPE_ORIGINS = [
  "https://js.stripe.com",
  "https://*.stripe.com",
].join(" ")

// Security headers incl. CSP (US-10.1 / RUM-65). The CSP whitelists the Medusa
// backend, Google Fonts (Material Symbols), Mercado Pago checkout, and unpkg
// (Swagger UI at /api/docs).
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com ${MP_ORIGINS} ${STRIPE_ORIGINS}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com ${MP_ORIGINS} ${STRIPE_ORIGINS}`,
  "font-src 'self' https://fonts.gstatic.com data:",
  `img-src 'self' data: blob: https: ${BACKEND_URL}`,
  `connect-src 'self' ${BACKEND_URL} https: ws: wss: ${MP_ORIGINS} ${STRIPE_ORIGINS}`,
  `frame-src 'self' ${MP_ORIGINS} ${STRIPE_ORIGINS}`,
  "worker-src 'self' blob:",
].join("; ")

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@gorumin/types"],
  // Cloud Run decodes %40 → @ in request URLs before they reach Next.js, but
  // Next.js 15 stores parallel-route chunks as %40login / %40dashboard on disk.
  // Rewrite decoded paths back so static chunks load (account login, etc.).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/_next/static/chunks/app/:path*/@:slot/:file*",
          destination: "/_next/static/chunks/app/:path*/%40:slot/:file*",
        },
      ],
    }
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
