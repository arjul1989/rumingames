# Gorumin — Documentación de APIs

Referencia completa de las APIs de la plataforma Gorumin (cards de videojuegos, mercado Colombia).
La arquitectura es headless: **Medusa** (backend) + **Next.js** (storefront con BFF).

> Para probar todo de forma interactiva usa la colección Postman en
> [`docs/postman/`](../postman/) junto con el environment `Gorumin Local` o `Gorumin Production`.
> La spec OpenAPI 3.0 del BFF vive en [`apps/storefront/openapi.json`](../../apps/storefront/openapi.json)
> y se sirve en vivo en `GET {{bff_url}}/openapi.json` (Swagger UI en `GET {{bff_url}}/docs`).

## Capas

| Capa | Base URL (local) | Auth | Uso |
|------|------------------|------|-----|
| **BFF Storefront** | `http://localhost:8000/api` | Cookie httpOnly `_gorumin_jwt` | Consumo desde el front. CORS + rate limiting. |
| **Medusa Store** | `http://localhost:9000/store` | Header `x-publishable-api-key` (+ Bearer cliente para rutas con auth) | API pública de tienda + endpoints custom. |
| **Medusa Admin** | `http://localhost:9000/admin` | Bearer admin (`/auth/user/emailpass`) | Operaciones internas (Fazer, órdenes, CMS). |
| **Webhooks** | `http://localhost:9000/hooks` | Firma del proveedor | Notificaciones de Mercado Pago. |

---

## 1. BFF Storefront (`/api/*`)

Proxy tipado a Medusa. Todas las respuestas incluyen cabeceras CORS y de rate limiting
(`x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`). Límite por IP configurable
(`BFF_RATE_LIMIT_*`, default 120 req/min); excederlo devuelve `429`.

### Catálogo
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Lista de productos con precio en COP. Query: `q`, `category_id`, `region`, `limit`, `offset`. |
| GET | `/api/products/:handle` | Detalle de producto por handle. Query: `region`. |
| GET | `/api/categories` | Árbol de categorías de productos. |

### Contenido (comunidad)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/articles` | Noticias publicadas. Query: `category_id`, `limit`, `offset`. |
| GET | `/api/articles/:slug` | Noticia + productos relacionados + tags. |
| GET | `/api/streamers` | Streamers. Query: `featured=true`, `limit`. |
| GET | `/api/feed` | Feed unificado (noticias + productos + streamers). |

### Carrito
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/api/cart` | `{ region?, email?, items? }` | Crea carrito. Setea cookie `_gorumin_cart_id`. |
| GET | `/api/cart` | — | Carrito actual (`?id=` o cookie). |
| POST | `/api/cart/:id` | `{ email?, ... }` | Actualiza carrito (email, direcciones). |
| POST | `/api/cart/:id/line-items` | `{ variant_id, quantity? }` | Agrega línea. |
| POST | `/api/cart/:id/line-items/:line` | `{ quantity }` | Actualiza cantidad. |
| DELETE | `/api/cart/:id/line-items/:line` | — | Elimina línea. |

### Checkout
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/api/checkout/payment-session` | `{ cart_id, provider_id? }` | Crea payment collection + sesión de pago (Mercado Pago). |
| POST | `/api/checkout/complete` | `{ cart_id }` | Completa el carrito y crea la orden. Limpia la cookie del carrito. |

### Autenticación (sesión de cliente)
La sesión se guarda en una cookie **httpOnly + sameSite=lax** (`_gorumin_jwt`), nunca accesible por JS del navegador.

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, first_name?, last_name?, phone? }` | Registra y deja sesión iniciada. |
| POST | `/api/auth/login` | `{ email, password }` | Login; setea cookie. |
| GET | `/api/auth/me` | — | Cliente actual o `{ customer: null }`. |
| POST | `/api/auth/logout` | — | Limpia la cookie. |

### Órdenes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/orders/:id/payment-status` | Público (id = token) | Estado normalizado: `pending\|approved\|rejected\|refunded`. |
| GET | `/api/orders/:id/digital-codes` | Cookie cliente + ownership | Revela los códigos digitales comprados. |

### Documentación
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/openapi.json` | Spec OpenAPI 3.0 del BFF. |
| GET | `/api/docs` | Swagger UI. |

---

## 2. Medusa Store API (endpoints custom)

Requieren header `x-publishable-api-key`. Las rutas autenticadas requieren además `Authorization: Bearer <customer_jwt>`
(obtenido con `POST /auth/customer/emailpass`).

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/store/articles` | publishable | Noticias publicadas (paginado). |
| GET | `/store/articles/:slug` | publishable | Noticia + productos relacionados + tags. |
| GET | `/store/streamers` | publishable | Streamers (`?featured=true`). |
| GET | `/store/feed` | publishable | Feed unificado. |
| GET | `/store/orders/:id/payment-status` | publishable | Estado de pago normalizado. |
| GET | `/store/orders/:id/digital-codes` | publishable + Bearer cliente | Códigos digitales (ownership). |
| GET | `/verify-email` | público | Procesa el enlace de verificación de email (`?token=&customer_id=`). |

> Las rutas estándar de Medusa (`/store/products`, `/store/product-categories`, `/store/regions`,
> `/store/carts`, `/store/customers`, etc.) también están disponibles y son las que el BFF consume internamente.

---

## 3. Medusa Admin API (endpoints custom)

Requieren autenticación de administrador. Obtén el token con `POST /auth/user/emailpass` (`{ email, password }`)
y úsalo como `Authorization: Bearer <admin_jwt>`.

### Fazer Cards (proveedor)
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| GET | `/admin/fazer/balance` | — | Saldo del proveedor + alerta de saldo bajo. |
| POST | `/admin/fazer/sync-catalog` | `{ categories?: string[] }` | Dispara la sincronización de catálogo/precios. |
| GET | `/admin/fazer/sync-catalog` | — | Último log de sincronización. |

### Órdenes
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/admin/orders/:id/retry-fulfillment` | — | Reintento idempotente del fulfillment digital. |
| POST | `/admin/orders/:id/refund-mp` | `{ amount?: number }` | Reembolso por Mercado Pago (total si `amount` es null). |

### CMS — Artículos
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| GET | `/admin/cms/articles` | — | Lista (`status`, `category_id`, `q`, `limit`, `offset`). |
| POST | `/admin/cms/articles` | `{ title, body, excerpt?, status?, category_id?, streamer_id?, tag_ids?, related_product_ids?, cover_image?, author?, slug? }` | Crea artículo. |
| GET | `/admin/cms/articles/:id` | — | Detalle. |
| POST | `/admin/cms/articles/:id` | (campos a actualizar) | Actualiza. |
| DELETE | `/admin/cms/articles/:id` | — | Elimina. |

### CMS — Categorías
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| GET | `/admin/cms/categories` | — | Lista de categorías. |
| POST | `/admin/cms/categories` | `{ name, slug? }` | Crea categoría. |

### CMS — Streamers
| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| GET | `/admin/cms/streamers` | — | Lista (`limit`, `offset`). |
| POST | `/admin/cms/streamers` | `{ name, slug?, avatar?, bio?, twitch_url?, youtube_url?, is_featured? }` | Crea streamer. |
| GET | `/admin/cms/streamers/:id` | — | Detalle. |
| POST | `/admin/cms/streamers/:id` | (campos a actualizar) | Actualiza. |
| DELETE | `/admin/cms/streamers/:id` | — | Elimina. |

---

## 4. Webhooks & Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/hooks/mercadopago` | Webhook de Mercado Pago. Verifica `x-signature` (HMAC-SHA256); firma inválida => `401`. Idempotente. |
| GET | `/health` | Healthcheck del backend. |

---

## Cómo probar con Postman

1. Importa la colección [`gorumin.postman_collection.json`](../postman/gorumin.postman_collection.json).
2. Importa el environment [`gorumin.local.postman_environment.json`](../postman/gorumin.local.postman_environment.json) (o el de producción) y selecciónalo.
3. Levanta los servicios: backend Medusa (`:9000`) y storefront (`:8000`).
4. Flujo sugerido:
   - **Admin login** (carpeta *Medusa Admin API*) → captura `admin_jwt` automáticamente.
   - **Customer login** o **BFF → Auth → Register/Login** → sesión de cliente.
   - **BFF → Catalog → Get product by handle** → copia un `variant.id` a `variant_id`.
   - **BFF → Cart → Create cart → Add line item** → `cart_id`/`line_id` se guardan solos.
   - **BFF → Checkout** → iniciar pago y completar.
   - **BFF → Orders** → estado de pago y códigos digitales.

> Las cookies httpOnly del BFF las gestiona el cookie jar de Postman automáticamente por dominio.
> El environment local incluye credenciales de **desarrollo** (admin `supersecret`); cámbialas en cualquier entorno real.

## Variables de environment

| Variable | Descripción |
|----------|-------------|
| `bff_url` / `medusa_url` | Bases de URL. |
| `publishable_key` | Publishable API key de Medusa (header store). |
| `region` | País ISO2 (default `co`). |
| `product_handle`, `variant_id`, `article_slug` | Datos de prueba del catálogo/CMS. |
| `cart_id`, `line_id`, `order_id` | Capturados por los scripts de tests. |
| `customer_email/password/jwt/id` | Credenciales y token de cliente. |
| `admin_email/password/jwt` | Credenciales y token de admin. |
| `article_id`, `streamer_id` | Capturados al crear recursos CMS. |
