#!/usr/bin/env python3
"""Seed RUM Jira project with Gorumin epics and user stories. Run once locally."""
import json
import os
import subprocess
import sys

BASE = "https://rumin.atlassian.net/rest/api/3"
EMAIL = os.environ.get("JIRA_EMAIL", "arjul1989@gmail.com")
TOKEN = os.environ.get("JIRA_API_TOKEN")
PROJECT = "RUM"
EPIC_TYPE = "10001"
STORY_TYPE = "10004"


def adf(text: str) -> dict:
    return {
        "type": "doc",
        "version": 1,
        "content": [{"type": "paragraph", "content": [{"type": "text", "text": text}]}],
    }


def adf_story(user_story: str, acceptance: list[str]) -> dict:
    content = [
        {
            "type": "heading",
            "attrs": {"level": 3},
            "content": [{"type": "text", "text": "Historia de usuario"}],
        },
        {"type": "paragraph", "content": [{"type": "text", "text": user_story}]},
        {
            "type": "heading",
            "attrs": {"level": 3},
            "content": [{"type": "text", "text": "Criterios de aceptación"}],
        },
    ]
    for item in acceptance:
        content.append(
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [{"type": "text", "text": item}],
                            }
                        ],
                    }
                ],
            }
        )
    return {"type": "doc", "version": 1, "content": content}


def request(method: str, path: str, data: dict | None = None) -> dict:
    url = f"{BASE}{path}"
    cmd = [
        "curl",
        "-s",
        "-X",
        method,
        "-u",
        f"{EMAIL}:{TOKEN}",
        "-H",
        "Content-Type: application/json",
        "-H",
        "Accept: application/json",
        url,
    ]
    if data is not None:
        cmd.extend(["-d", json.dumps(data)])
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"curl failed {path}: {result.stderr}")
        raise RuntimeError(result.stderr)
    raw = result.stdout.strip()
    if not raw:
        return {}
    parsed = json.loads(raw)
    if "errorMessages" in parsed or "errors" in parsed and parsed.get("errors"):
        print(f"API error {path}: {raw[:500]}")
        raise RuntimeError(raw)
    return parsed


def create_epic(num: int, title: str, description: str) -> str:
    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"id": EPIC_TYPE},
            "summary": f"[Épica {num}] {title}",
            "description": adf(description),
        }
    }
    result = request("POST", "/issue", payload)
    key = result["key"]
    print(f"  Epic {key}: {title}")
    return key


def create_story(epic_key: str, story_id: str, title: str, user_story: str, acceptance: list[str]) -> str:
    payload = {
        "fields": {
            "project": {"key": PROJECT},
            "issuetype": {"id": STORY_TYPE},
            "parent": {"key": epic_key},
            "summary": f"{story_id} — {title}",
            "description": adf_story(user_story, acceptance),
        }
    }
    result = request("POST", "/issue", payload)
    key = result["key"]
    print(f"    {key}: {story_id}")
    return key


EPICS = [
    {
        "num": 0,
        "title": "Infraestructura y proyecto base",
        "description": "Monorepo, entornos local/prod, GCP mínimo costo.",
        "stories": [
            (
                "US-0.1",
                "Monorepo",
                "Como desarrollador, quiero un monorepo con Medusa v2 y Next.js 15, para trabajar backend y frontend en un solo repo.",
                [
                    "Estructura apps/medusa, apps/storefront, packages/types",
                    "pnpm workspaces + scripts dev, build, test",
                    "TypeScript estricto en todo el monorepo",
                    ".env.example con variables documentadas",
                ],
            ),
            (
                "US-0.2",
                "Infra GCP MVP",
                "Como operador, quiero infra GCP económica, para mantener costos ~$12–20/mes en MVP.",
                [
                    "Cloud SQL PostgreSQL db-f1-micro",
                    "Cloud Run para Medusa y Next.js (scale to zero)",
                    "Cloud Storage para assets",
                    "Upstash Redis (externo, free tier)",
                    "Secret Manager para API keys",
                    "Cloud DNS: gorumin.com, www.gorumin.com",
                ],
            ),
            (
                "US-0.3",
                "CI/CD",
                "Como desarrollador, quiero deploy automático a GCP al merge en main, para no desplegar manualmente.",
                [
                    "GitHub Actions: build → push imagen → deploy Cloud Run",
                    "Entornos staging y production",
                    "Health checks en /health",
                ],
            ),
        ],
    },
    {
        "num": 1,
        "title": "Modelo de datos y backend core (Colombia)",
        "description": "Medusa configurado para Colombia con entidades base.",
        "stories": [
            (
                "US-1.1",
                "Región Colombia",
                "Como administrador, quiero una región Colombia con COP y Mercado Pago, para vender solo en Colombia en el MVP.",
                [
                    "Región colombia con currency cop",
                    "País co, tax rate configurado (IVA Colombia si aplica)",
                    "Payment provider Mercado Pago habilitado en la región",
                    "Seed script reproducible",
                ],
            ),
            (
                "US-1.2",
                "Catálogo de productos digital",
                "Como administrador, quiero productos tipo gift card con variantes, para representar cards de distintas plataformas y valores.",
                [
                    "Product types: gift_card, game_topup, subscription",
                    "Variantes por valor (Steam $10, $20, $50 USD equivalente en COP)",
                    "Metadata: platform, region, fazer_sku_id, delivery_type",
                    "Categorías: Steam, PlayStation, Nintendo, Xbox, Riot, etc.",
                ],
            ),
            (
                "US-1.3",
                "Entidad proveedor externo",
                "Como sistema, quiero vincular cada producto a un SKU de Fazer Cards, para automatizar la compra al proveedor.",
                [
                    "Tabla supplier_product_mapping (medusa_product_id, fazer_sku_id, last_synced_price_usd, margin_pct)",
                    "Estado: active, inactive, out_of_stock",
                    "Log de sincronización de precios",
                ],
            ),
            (
                "US-1.4",
                "Órdenes digitales",
                "Como sistema, quiero extender órdenes con datos de entrega digital, para guardar códigos y estado de fulfillment.",
                [
                    "Tabla digital_deliveries (order_id, line_item_id, fazer_order_id, code_encrypted, status, delivered_at)",
                    "Estados: pending, processing, delivered, failed, refunded",
                    "Códigos encriptados at rest (AES-256)",
                ],
            ),
            (
                "US-1.5",
                "Usuarios y autenticación",
                "Como cliente, quiero registrarse e iniciar sesión, para ver historial de compras y códigos.",
                [
                    "Auth Medusa nativo (email/password)",
                    "Customer linked a órdenes",
                    "JWT para storefront",
                ],
            ),
        ],
    },
    {
        "num": 2,
        "title": "Integración Fazer Cards",
        "description": "Catálogo sincronizado y fulfillment automático post-pago.",
        "stories": [
            (
                "US-2.1",
                "Cliente Fazer Cards",
                "Como backend, quiero un cliente tipado para la API Fazer Cards, para consumir catálogo y órdenes de forma segura.",
                [
                    "SDK fazercards integrado en módulo Medusa",
                    "Config: FAZER_API_KEY, timeout, retries",
                    "Manejo de errores: 429, 5xx, timeout",
                    "Tests con mocks",
                ],
            ),
            (
                "US-2.2",
                "Sync catálogo",
                "Como administrador, quiero sincronizar productos desde Fazer Cards, para no cargar SKUs manualmente.",
                [
                    "Job/cron GET catalog → upsert en Medusa",
                    "Filtro por categorías relevantes (gift cards, top-ups)",
                    "Precio COP = precio USD Fazer × tasa + margen configurable",
                    "Admin: botón Sincronizar catálogo + log de última sync",
                    "Productos desactivados en Fazer → inactive en Medusa",
                ],
            ),
            (
                "US-2.3",
                "Verificación de balance",
                "Como operador, quiero ver el balance Fazer Cards en admin, para saber si hay saldo para fulfillment.",
                [
                    "Endpoint admin GET /admin/fazer/balance",
                    "Widget en Medusa Admin con balance USD",
                    "Alerta si balance < umbral configurable",
                ],
            ),
            (
                "US-2.4",
                "Fulfillment automático",
                "Como cliente, quiero recibir mi código al pagar, para usar la card de inmediato.",
                [
                    "Al payment.captured: workflow crea orden en Fazer",
                    "Idempotency key por line item",
                    "Código guardado encriptado en digital_deliveries",
                    "Email con código o reveal en Mis órdenes",
                    "Reintentos en fallo (3 intentos, luego failed + alerta admin)",
                ],
            ),
            (
                "US-2.5",
                "Webhooks Fazer Cards",
                "Como sistema, quiero recibir webhooks de Fazer, para actualizar estado async.",
                [
                    "Endpoint POST /hooks/fazer",
                    "Verificación de firma webhook",
                    "Actualiza digital_deliveries.status",
                    "Reconciliación si webhook llega antes que respuesta sync",
                ],
            ),
            (
                "US-2.6",
                "Reembolsos y fallos",
                "Como operador, quiero manejar órdenes fallidas, para refund o reintento manual.",
                [
                    "Admin: lista órdenes failed con detalle de error Fazer",
                    "Acción: reintentar fulfillment",
                    "Acción: marcar para refund manual MP",
                ],
            ),
        ],
    },
    {
        "num": 3,
        "title": "Integración Mercado Pago (Colombia)",
        "description": "Pagos en COP con métodos locales colombianos.",
        "stories": [
            (
                "US-3.1",
                "Payment provider MP Colombia",
                "Como cliente colombiano, quiero pagar con Mercado Pago, para usar tarjetas y métodos locales.",
                [
                    "Plugin MP Medusa v2 con soporte es-CO",
                    "Credenciales sandbox y production en Secret Manager",
                    "Locale es-CO, currency COP",
                    "Métodos: tarjetas crédito/débito, PSE si disponible",
                ],
            ),
            (
                "US-3.2",
                "Checkout Brick / Pro",
                "Como cliente, quiero un checkout integrado con MP, para pagar sin salir del sitio.",
                [
                    "Payment Brick o Checkout Pro según evaluación MP Colombia",
                    "Creación de preferencia/payment con total en COP",
                    "Metadata: order_id, customer_email",
                ],
            ),
            (
                "US-3.3",
                "Webhooks Mercado Pago",
                "Como sistema, quiero webhooks MP, para confirmar pagos async y disparar fulfillment.",
                [
                    "Endpoint POST /hooks/mercadopago",
                    "Verificación webhookSecret / x-signature",
                    "Eventos: payment.created, payment.updated",
                    "Idempotencia: no procesar dos veces el mismo payment",
                    "payment.captured → trigger fulfillment Fazer",
                ],
            ),
            (
                "US-3.4",
                "Estados de pago",
                "Como cliente, quiero ver el estado de mi pago, para saber si la compra se completó.",
                [
                    "Estados: pending, approved, rejected, refunded",
                    "Página post-checkout con estado en tiempo real",
                    "Timeout: orden cancelada si no paga en 30 min",
                ],
            ),
            (
                "US-3.5",
                "Reembolsos MP",
                "Como operador, quiero iniciar refund desde admin, para devolver pagos de órdenes fallidas.",
                [
                    "Acción admin Refund en orden",
                    "Llamada API MP refund",
                    "Actualiza orden Medusa + digital_deliveries",
                ],
            ),
        ],
    },
    {
        "num": 4,
        "title": "Módulo CMS — Noticias y contenido",
        "description": "Sistema de entradas nativo en Medusa Admin.",
        "stories": [
            (
                "US-4.1",
                "Modelo de artículos",
                "Como editor, quiero crear entradas de noticias, para publicar novedades gaming.",
                [
                    "Tabla articles: title, slug, excerpt, body, cover_image, author, status, published_at",
                    "Tabla article_categories: Noticias, Reviews, Esports, Streamers, Guías",
                    "Tabla article_tags",
                    "Status: draft, published, archived",
                ],
            ),
            (
                "US-4.2",
                "Admin noticias en Medusa",
                "Como editor, quiero un panel en Medusa Admin para noticias, para no usar otro CMS.",
                [
                    "UI custom en Medusa Admin: lista, crear, editar, preview",
                    "Editor rich text o Markdown",
                    "Upload cover image",
                    "Publicar / despublicar",
                    "Separado visualmente del módulo Productos",
                ],
            ),
            (
                "US-4.3",
                "Vincular artículos a productos",
                "Como editor, quiero enlazar productos en un artículo, para monetizar contenido.",
                [
                    "Campo related_product_ids en artículo",
                    "Bloque Productos relacionados en API",
                    "Admin: selector de productos Medusa",
                ],
            ),
            (
                "US-4.4",
                "Streamers",
                "Como editor, quiero perfiles de streamers, para la sección comunidad.",
                [
                    "Tabla streamers: name, slug, avatar, bio, twitch_url, youtube_url, is_featured",
                    "CRUD en Medusa Admin",
                    "Relación opcional artículo ↔ streamer",
                ],
            ),
            (
                "US-4.5",
                "Feed unificado",
                "Como API, quiero un feed de novedades, para mezclar artículos y productos nuevos.",
                [
                    "Endpoint GET /store/feed con paginación",
                    "Items: article, product, streamer_highlight",
                    "Orden por published_at / created_at",
                ],
            ),
        ],
    },
    {
        "num": 5,
        "title": "Capa media — APIs y BFF",
        "description": "APIs unificadas, seguras y documentadas entre Medusa y el frontend.",
        "stories": [
            (
                "US-5.1",
                "API Store pública",
                "Como frontend, quiero APIs REST claras, para no llamar Medusa directamente en cada componente.",
                [
                    "BFF en Next.js API routes o proxy a Medusa",
                    "Endpoints: products, categories, cart, checkout, articles, streamers, feed",
                    "Rate limiting básico",
                    "CORS configurado",
                ],
            ),
            (
                "US-5.2",
                "API Admin extendida",
                "Como admin, quiero endpoints para operaciones custom, para Fazer sync, refunds y noticias.",
                [
                    "POST /admin/fazer/sync-catalog",
                    "GET /admin/fazer/balance",
                    "POST /admin/orders/:id/retry-fulfillment",
                    "POST /admin/orders/:id/refund",
                    "CRUD articles vía admin API",
                ],
            ),
            (
                "US-5.3",
                "Autenticación API",
                "Como sistema, quiero JWT y sesiones seguras, para proteger órdenes y códigos.",
                [
                    "Store: customer JWT en cookie httpOnly",
                    "Admin: Medusa Admin auth",
                    "Códigos digitales solo con auth + ownership de orden",
                ],
            ),
            (
                "US-5.4",
                "Documentación API",
                "Como desarrollador, quiero OpenAPI/Swagger, para integrar el front con confianza.",
                [
                    "Spec OpenAPI 3.0 para endpoints custom",
                    "Hosted en /api/docs (staging) o archivo en repo",
                ],
            ),
            (
                "US-5.5",
                "Conversión de moneda",
                "Como sistema, quiero convertir USD (Fazer) a COP (venta), para precios correctos.",
                [
                    "Servicio exchange_rate: USD → COP",
                    "Margen % configurable por categoría o global",
                    "Precios redondeados a COP sin decimales",
                    "Job diario actualiza precios si tasa cambia > umbral",
                ],
            ),
        ],
    },
    {
        "num": 6,
        "title": "Geo-routing y multi-país (base)",
        "description": "Colombia como default; base para expandir después.",
        "stories": [
            (
                "US-6.1",
                "Detección de país",
                "Como visitante de Colombia, quiero ser redirigido a /co al entrar en gorumin.com.",
                [
                    "gorumin.com detecta país (geo header o middleware)",
                    "Colombia (CO) → redirect gorumin.com/co",
                    "Otros países MVP: redirect /co o página Próximamente",
                    "Cookie gorumin_country=co para no re-detectar",
                ],
            ),
            (
                "US-6.2",
                "Rutas por país",
                "Como frontend, quiero rutas bajo /co, para escalar a /mx, /ar después.",
                [
                    "Next.js [country] dynamic segment",
                    "Validación: solo co activo en MVP",
                    "Links internos siempre con prefijo /co",
                    "hreflang preparado para futuros países",
                ],
            ),
            (
                "US-6.3",
                "Config por país",
                "Como sistema, quiero config por país, para moneda, pagos y proveedor.",
                [
                    "Config countries/co.ts: currency COP, MP CO, Fazer enabled",
                    "Productos filtrados por región Medusa Colombia",
                ],
            ),
        ],
    },
    {
        "num": 7,
        "title": "Frontend storefront",
        "description": "UI comunidad-first con tienda integrada.",
        "stories": [
            (
                "US-7.1",
                "Layout y navegación",
                "Como usuario, quiero navegar entre Noticias, Streamers y Tienda.",
                [
                    "Header: Logo, Noticias, Streamers, Tienda, Carrito, Login",
                    "Footer: links, legal, país",
                    "Dark mode gaming, responsive mobile-first",
                    "Rutas: /co, /co/noticias, /co/streamers, /co/tienda",
                ],
            ),
            (
                "US-7.2",
                "Home comunidad-first",
                "Como usuario, quiero una home con noticias destacadas y streamers.",
                [
                    "Hero: artículo destacado",
                    "Grid noticias recientes (6)",
                    "Carrusel streamers destacados",
                    "Bloque Cards populares (4–6 productos)",
                    "CTA a tienda",
                ],
            ),
            (
                "US-7.3",
                "Listado y detalle noticias",
                "Como lector, quiero leer noticias con productos relacionados.",
                [
                    "/co/noticias — listado con filtros por categoría",
                    "/co/noticias/[slug] — artículo completo",
                    "Bloque productos relacionados con add-to-cart",
                    "Compartir social (Open Graph)",
                ],
            ),
            (
                "US-7.4",
                "Streamers",
                "Como fan, quiero ver perfiles de streamers.",
                [
                    "/co/streamers — grid de streamers",
                    "/co/streamers/[slug] — perfil + artículos relacionados",
                ],
            ),
            (
                "US-7.5",
                "Tienda",
                "Como comprador, quiero navegar y comprar gift cards.",
                [
                    "/co/tienda — categorías y productos",
                    "/co/tienda/[categoria] — listado filtrado",
                    "/co/tienda/producto/[slug] — detalle, variantes, precio COP",
                    "Add to cart, carrito persistente",
                ],
            ),
            (
                "US-7.6",
                "Checkout Mercado Pago",
                "Como comprador, quiero pagar con MP en COP.",
                [
                    "/co/checkout — resumen, MP Brick/Pro",
                    "/co/checkout/success, pending, failure",
                ],
            ),
            (
                "US-7.7",
                "Mi cuenta",
                "Como cliente registrado, quiero ver mis órdenes y códigos.",
                [
                    "Login / registro",
                    "/co/cuenta/ordenes — historial",
                    "/co/cuenta/ordenes/[id] — detalle + reveal código",
                    "Código visible solo si delivered",
                ],
            ),
        ],
    },
    {
        "num": 8,
        "title": "SEO, meta tags y jerarquía de headings",
        "description": "Sitio bien mapeado para buscadores con H1–H3 coherentes.",
        "stories": [
            (
                "US-8.1",
                "Meta tags globales",
                "Como SEO, quiero meta tags en todas las páginas.",
                [
                    "Next.js metadata API en cada página",
                    "title único, meta description, canonical",
                    "robots: index/follow en público; noindex en checkout/cuenta",
                    "og:title, og:description, og:image, og:url, og:type",
                    "twitter:card, twitter:title, twitter:description, twitter:image",
                ],
            ),
            (
                "US-8.2",
                "Jerarquía H1–H3 por template",
                "Como SEO, quiero jerarquía de headings correcta en cada template.",
                [
                    "Un solo H1 por página",
                    "H2 para secciones principales, H3 para items",
                    "Sin saltos de jerarquía (H1 → H3 sin H2)",
                    "Componente PageHeading reusable",
                ],
            ),
            (
                "US-8.3",
                "Structured data (JSON-LD)",
                "Como SEO, quiero schema.org para rich results.",
                [
                    "Organization + WebSite en home",
                    "Article/NewsArticle en noticias",
                    "Product + Offer en productos (precio COP)",
                    "BreadcrumbList en páginas con depth > 1",
                    "Person en perfiles streamer",
                ],
            ),
            (
                "US-8.4",
                "Sitemap y robots",
                "Como SEO, quiero sitemap.xml y robots.txt.",
                [
                    "robots.txt con sitemap URL",
                    "sitemap.xml dinámico: home, noticias, streamers, productos",
                    "lastmod en URLs de contenido",
                ],
            ),
            (
                "US-8.5",
                "hreflang y locale",
                "Como SEO, quiero hreflang preparado para más países.",
                [
                    "hreflang=es-CO en páginas /co",
                    "x-default → /co (MVP)",
                    "lang=es-CO en html",
                ],
            ),
            (
                "US-8.6",
                "SEO en admin noticias",
                "Como editor, quiero campos SEO en artículos.",
                [
                    "Campos: seo_title, seo_description, og_image",
                    "Preview de cómo se verá en Google",
                    "Slug editable con validación única",
                ],
            ),
            (
                "US-8.7",
                "Performance SEO",
                "Como SEO, quiero Core Web Vitals buenos.",
                [
                    "LCP < 2.5s, CLS < 0.1",
                    "Images: Next Image, WebP, lazy load",
                    "Fonts: preload, subset",
                ],
            ),
        ],
    },
    {
        "num": 9,
        "title": "Medusa Admin nativo + operaciones",
        "description": "Operar tienda y contenido desde un solo admin.",
        "stories": [
            (
                "US-9.1",
                "Admin commerce nativo",
                "Como operador, quiero usar Medusa Admin para productos, órdenes y clientes.",
                [
                    "Productos, variantes, categorías vía admin nativo",
                    "Órdenes, pagos, clientes nativos",
                    "Regiones y MP configurados",
                    "No duplicar CRUD de productos en custom UI",
                ],
            ),
            (
                "US-9.2",
                "Widgets custom en Admin",
                "Como operador, quiero dashboards custom para Fazer y fulfillment.",
                [
                    "Widget: balance Fazer Cards",
                    "Widget: órdenes pendientes de fulfillment",
                    "Widget: última sync catálogo",
                    "Link rápido a retry fulfillment",
                ],
            ),
            (
                "US-9.3",
                "Permisos editor vs admin",
                "Como admin, quiero roles separados.",
                [
                    "Role editor: solo articles, streamers",
                    "Role admin: todo + Fazer + refunds",
                    "Role support: órdenes, retry, sin refunds",
                ],
            ),
        ],
    },
    {
        "num": 10,
        "title": "Seguridad, legal y launch",
        "description": "Go-live Colombia en gorumin.com/co.",
        "stories": [
            (
                "US-10.1",
                "Seguridad",
                "Como operador, quiero medidas de seguridad básicas.",
                [
                    "HTTPS everywhere",
                    "API keys solo en Secret Manager",
                    "Rate limit en webhooks y login",
                    "Códigos encriptados, nunca en logs",
                    "CSP headers en Next.js",
                ],
            ),
            (
                "US-10.2",
                "Legal Colombia",
                "Como negocio, quiero páginas legales.",
                [
                    "/co/terminos, /co/privacidad, /co/contacto",
                    "Footer links",
                    "Cookie consent básico",
                ],
            ),
            (
                "US-10.3",
                "Monitoreo",
                "Como operador, quiero alertas.",
                [
                    "Cloud Logging + alertas: fulfillment failed, MP webhook error, Fazer balance low",
                    "Uptime check en /health",
                ],
            ),
            (
                "US-10.4",
                "Go-live Colombia",
                "Como negocio, quiero lanzar en producción.",
                [
                    "DNS apuntando a GCP",
                    "MP production credentials",
                    "Fazer production API key",
                    "Smoke test: compra real → código entregado",
                    "Google Search Console configurado",
                ],
            ),
        ],
    },
]


def main():
    if not TOKEN:
        print("Set JIRA_API_TOKEN environment variable")
        sys.exit(1)

    print("Seeding Jira project RUM...")
    created_epics = []
    for epic in EPICS:
        key = create_epic(epic["num"], epic["title"], epic["description"])
        created_epics.append(key)
        for story_id, title, user_story, acceptance in epic["stories"]:
            create_story(key, story_id, title, user_story, acceptance)

    print(f"\nDone. Created {len(created_epics)} epics.")
    print("Board: https://rumin.atlassian.net/jira/software/projects/RUM/boards/1")


if __name__ == "__main__":
    main()
