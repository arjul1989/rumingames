import {
  loadEnv,
  defineConfig,
  Modules,
  ContainerRegistrationKeys,
} from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL
const IS_PROD = process.env.NODE_ENV === 'production'
const MOCK_MP = !IS_PROD && process.env.MOCK_MP === 'true'
const MOCK_FAZER = !IS_PROD && process.env.MOCK_FAZER === 'true'
const MOCK_WOMPI = !IS_PROD && process.env.MOCK_WOMPI === 'true'

// Fazer Cards module is registered when an API key is configured (or mock mode in dev).
const fazerModules = process.env.FAZER_API_KEY || MOCK_FAZER
  ? [{ resolve: './src/modules/fazer' }]
  : []

const paymentProviders: Array<{
  resolve: string
  id: string
  options: Record<string, unknown>
}> = []

if (process.env.MP_ACCESS_TOKEN || MOCK_MP) {
  paymentProviders.push({
    resolve: './src/modules/payment-mercadopago',
    id: 'mercadopago',
    options: {
      accessToken: process.env.MP_ACCESS_TOKEN || 'mock-mp-local',
      publicKey: process.env.MP_PUBLIC_KEY,
      webhookSecret: process.env.MP_WEBHOOK_SECRET,
      locale: process.env.MP_LOCALE || 'es-CO',
      notificationUrl: process.env.MP_NOTIFICATION_URL,
      callbackUrl:
        process.env.MP_CALLBACK_URL ||
        (process.env.STOREFRONT_URL
          ? `${process.env.STOREFRONT_URL.replace(/\/$/, "")}/co/checkout/pending`
          : undefined),
      statementDescriptor: process.env.MP_STATEMENT_DESCRIPTOR || 'GORUMIN',
    },
  })
}

if (process.env.WOMPI_PRIVATE_KEY || MOCK_WOMPI) {
  paymentProviders.push({
    resolve: './src/modules/payment-wompi',
    id: 'wompi',
    options: {
      publicKey: process.env.WOMPI_PUBLIC_KEY || 'pub_mock_wompi',
      privateKey: process.env.WOMPI_PRIVATE_KEY || 'prv_mock_wompi',
      integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
      eventsSecret: process.env.WOMPI_EVENTS_SECRET,
      baseUrl: process.env.WOMPI_API_BASE_URL || 'https://sandbox.wompi.co/v1',
      redirectUrl:
        process.env.WOMPI_REDIRECT_URL ||
        (process.env.STOREFRONT_URL
          ? `${process.env.STOREFRONT_URL.replace(/\/$/, "")}/co/checkout/pending`
          : undefined),
    },
  })
}

const paymentModules =
  paymentProviders.length > 0
    ? [
        {
          resolve: '@medusajs/medusa/payment',
          options: { providers: paymentProviders },
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

// Google OAuth (RUM-69 / US-1.6). Registered only when credentials are set so
// local dev without Google Cloud still boots with default emailpass auth.
const googleOAuthConfigured =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL

const authModules = googleOAuthConfigured
  ? [
      {
        resolve: '@medusajs/medusa/auth',
        dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/auth-emailpass',
              id: 'emailpass',
            },
            {
              resolve: '@medusajs/medusa/auth-google',
              id: 'google',
              options: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackUrl: process.env.GOOGLE_CALLBACK_URL,
              },
            },
          ],
        },
      },
    ]
  : []

// Brevo transactional email (production). Falls back to console logging locally.
const brevoConfigured = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_FROM_EMAIL)

const notificationModules = [
  {
    resolve: '@medusajs/medusa/notification',
    options: {
      providers: [
        brevoConfigured
          ? {
              resolve: './src/modules/notification-brevo',
              id: 'brevo',
              options: {
                channels: ['email'],
                apiKey: process.env.BREVO_API_KEY,
                from: process.env.BREVO_FROM_EMAIL,
                senderName: process.env.BREVO_SENDER_NAME || 'rumin',
                replyTo: process.env.BREVO_REPLY_TO || process.env.ADMIN_ALERT_EMAIL,
                templateIds: {
                  'order-placed': process.env.BREVO_TEMPLATE_ORDER_PLACED,
                  'email-verification': process.env.BREVO_TEMPLATE_EMAIL_VERIFICATION,
                  'digital-code-delivered': process.env.BREVO_TEMPLATE_DIGITAL_CODE,
                },
              },
            }
          : {
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
]

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
      resolve: './src/modules/funding',
    },
    {
      resolve: './src/modules/cms',
    },
    ...fazerModules,
    ...authModules,
    ...paymentModules,
    ...notificationModules,
  ],
})
