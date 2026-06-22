import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL

// Fazer Cards module is registered only when an API key is configured, so the
// app still boots locally without supplier credentials (US-2.1 / RUM-16).
const fazerModules = process.env.FAZER_API_KEY
  ? [{ resolve: './src/modules/fazer' }]
  : []

// Mercado Pago payment provider is registered only when an access token is
// configured (US-3.1 / RUM-23). Without it, Medusa keeps the system default
// provider so checkout still works locally.
const paymentModules = process.env.MP_ACCESS_TOKEN
  ? [
      {
        resolve: '@medusajs/medusa/payment',
        options: {
          providers: [
            {
              resolve: './src/modules/payment-mercadopago',
              id: 'mercadopago',
              options: {
                accessToken: process.env.MP_ACCESS_TOKEN,
                publicKey: process.env.MP_PUBLIC_KEY,
                webhookSecret: process.env.MP_WEBHOOK_SECRET,
                locale: process.env.MP_LOCALE || 'es-CO',
                notificationUrl: process.env.MP_NOTIFICATION_URL,
                statementDescriptor: process.env.MP_STATEMENT_DESCRIPTOR || 'GORUMIN',
              },
            },
          ],
        },
      },
    ]
  : []

// Redis-backed modules are enabled only when REDIS_URL is set (staging/prod).
// Locally without Redis, Medusa falls back to its in-memory defaults.
const redisModules = REDIS_URL
  ? [
      {
        resolve: '@medusajs/medusa/cache-redis',
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/event-bus-redis',
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/workflow-engine-redis',
        // This module version expects `redis.url` (the deprecation hint about
        // `redisUrl` does not apply to the loader yet — it throws if used).
        options: { redis: { url: REDIS_URL } },
      },
      {
        resolve: '@medusajs/medusa/locking',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/locking-redis',
              id: 'locking-redis',
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    ...redisModules,
    {
      resolve: './src/modules/supplier',
    },
    {
      resolve: './src/modules/digital-delivery',
    },
    {
      resolve: './src/modules/cms',
    },
    ...fazerModules,
    ...paymentModules,
    {
      // Local provider logs emails to the console in dev.
      // Swap for @medusajs/medusa/notification-sendgrid in production.
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: {
              name: 'Local Notification Provider',
              channels: ['email'],
            },
          },
        ],
      },
    },
  ],
})
