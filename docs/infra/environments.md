# Entornos: local, sandbox y producción

Gorumin opera en **tres entornos aislados**. Cada uno tiene su propia base de datos, URLs, credenciales de pago (sandbox vs live) y servicios Cloud Run.

| | **Local** | **Sandbox** | **Producción** |
|---|-----------|-------------|----------------|
| **Propósito** | Desarrollo diario | Pre-prod en internet, QA, demos | Clientes reales |
| **URL tienda** | http://localhost:8000 | https://sbx.gorumin.com | https://gorumin.com |
| **URL API** | http://localhost:9000 | https://api.sbx.gorumin.com | https://api.gorumin.com |
| **Base de datos** | Postgres local | Cloud SQL `gorumin-db-sbx` | Cloud SQL `gorumin-db` |
| **Cloud Run** | — | `gorumin-*-sbx` | `gorumin-medusa`, `gorumin-storefront` |
| **Rama Git** | cualquier feature | `develop` | `main` |
| **Deploy** | `pnpm dev` | `./infra/gcp/deploy-sandbox.sh` | `./infra/gcp/deploy-prod.sh` |
| **Pagos** | mocks / sandbox keys | sandbox/test keys | live keys |

```
feature/xyz ──PR──► develop ──deploy──► sbx.gorumin.com
                      │
                      └──PR (release)──► main ──deploy──► gorumin.com
```

## Estrategia de ramas (Git)

| Rama | Reglas |
|------|--------|
| `main` | Protegida. Solo entra vía PR aprobado desde `develop`. CI debe pasar. Deploy manual a producción. |
| `develop` | Integración continua. Deploy manual (o automático) a sandbox. |
| `feature/*`, `fix/*` | Ramas de trabajo. PR → `develop`. CI en el PR. |

**Flujo recomendado**

1. Crear rama desde `develop`: `git checkout develop && git pull && git checkout -b feature/mi-cambio`
2. Desarrollar en local, commit, push, abrir PR → `develop`
3. Tras merge, deploy a sandbox y probar en https://sbx.gorumin.com
4. Cuando sandbox esté validado, PR `develop` → `main` y deploy a producción

**Hotfix en producción:** rama `hotfix/*` desde `main` → PR a `main` y cherry-pick/merge back a `develop`.

---

## 1. Entorno local

### Archivos de configuración

| Archivo | Uso |
|---------|-----|
| `/.env.example` | Referencia de todas las variables |
| `/infra/gcp/env.local.example` | Mapa local (URLs, CORS, mocks) |
| `apps/medusa/.env` | Medusa local (gitignored) |
| `apps/storefront/.env.local` | Storefront local (gitignored) |

### Arranque

```bash
# Postgres + Redis (Homebrew o Docker)
brew services start postgresql@15 redis

# Dependencias
pnpm install

# Medusa (apps/medusa)
cp .env.template .env   # editar credenciales
pnpm --filter @gorumin/medusa dev

# Storefront (otra terminal)
cp .env.template .env.local
pnpm --filter @gorumin/storefront dev
```

- Tienda: http://localhost:8000  
- API / Admin: http://localhost:9000/app  

### Webhooks de pago en local

Los proveedores (Wompi, ePayco, MP) necesitan URL pública. Usa un túnel:

```bash
ngrok http 9000
# Actualizar WOMPI_NOTIFICATION_URL, EPAYCO_NOTIFICATION_URL, MP_NOTIFICATION_URL
# en apps/medusa/.env con la URL del túnel + /hooks/...
```

---

## 2. Entorno sandbox (sbx.gorumin.com)

Sandbox es un **stack GCP paralelo** en el mismo proyecto (`sims-499022`), con base de datos y servicios Cloud Run separados.

### Recursos GCP (sandbox)

| Recurso | Nombre |
|---------|--------|
| Cloud SQL | `gorumin-db-sbx` |
| Base de datos | `gorumin_medusa_sbx` |
| Usuario DB | `gorumin_sbx` |
| Cloud Run Medusa | `gorumin-medusa-sbx` |
| Cloud Run Storefront | `gorumin-storefront-sbx` |
| Dominio tienda | `sbx.gorumin.com` |
| Dominio API | `api.sbx.gorumin.com` |

Artifact Registry (`gorumin`) se **comparte** con producción; las imágenes se distinguen por tag (git SHA) y servicio.

### Scripts

| Script | Acción |
|--------|--------|
| `./infra/gcp/bootstrap-sandbox.sh` | Crea Cloud SQL sandbox (una vez) |
| `cp infra/gcp/env.sandbox.example infra/gcp/.env.sandbox` | Plantilla de secrets |
| `./infra/gcp/deploy-sandbox.sh` | Build + deploy Medusa + Storefront |
| `./infra/gcp/remap-domains-sandbox.sh` | Mapea dominios Cloud Run |
| `./infra/gcp/sync-sandbox.sh` | Sincroniza CMS/catálogo en DB sandbox |

### Credenciales sandbox

En `infra/gcp/.env.sandbox` usa **solo claves de prueba**:

- Mercado Pago: credenciales TEST  
- Wompi: `pub_test_` / `sandbox.wompi.co`  
- ePayco: `EPAYCO_TEST_MODE=true`  
- Fazer: API key de sandbox si existe  
- JWT / COOKIE / ENCRYPTION: **valores distintos a producción**

---

## 3. Entorno producción (gorumin.com)

Ya desplegado. Scripts existentes:

| Script | Acción |
|--------|--------|
| `./infra/gcp/bootstrap.sh` | Cloud SQL prod (ya hecho) |
| `infra/gcp/.env.production` | Secrets prod (gitignored) |
| `./infra/gcp/deploy-prod.sh` | Deploy prod |
| `./infra/gcp/remap-domains.sh` | gorumin.com / api.gorumin.com |
| `./infra/gcp/sync-prod.sh` | Sync contenido prod |

---

## Checklist: montar sandbox por primera vez

Pasos que **debes hacer tú** (no automatizables desde el repo):

| Paso | Estado |
|------|--------|
| A.3 DNS (`sbx`, `api.sbx`) | ✅ Hecho |
| B. Secrets / `.env.sandbox` | ✅ Generado (revisar claves de pago) |
| C. Bootstrap + deploy | 🔄 Medusa en redeploy |
| D. Admin sandbox | ⏳ Tras Medusa healthy |
| E. Webhooks proveedores | ⏳ Pendiente |
| F. Google OAuth | ✅ Hecho |
| G. GitHub Environments | ✅ Hecho |
| H. Redis (Upstash) | ⏳ Opcional — sin `REDIS_URL` usa memoria local |

### A. DNS (Cloudflare o tu registrador)

1. Verifica que `gorumin.com` ya está verificado en GCP (dominio raíz en Cloud Run).
2. Tras `./infra/gcp/remap-domains-sandbox.sh`, GCP mostrará registros DNS requeridos:

```bash
gcloud beta run domain-mappings describe \
  --domain=sbx.gorumin.com --region=us-central1

gcloud beta run domain-mappings describe \
  --domain=api.sbx.gorumin.com --region=us-central1
```

3. Crea registros **CNAME** (o los que indique GCP) para:
   - `sbx` → Cloud Run storefront sandbox  
   - `api.sbx` → Cloud Run medusa sandbox  

Espera propagación DNS (5–60 min) y emisión de certificado SSL.

### B. Secrets y env file

```bash
./infra/gcp/init-sandbox-env.sh          # genera .env.sandbox con secrets aleatorios
# Tras bootstrap-sandbox, actualiza DB_PASSWORD con el valor que imprime el script
# Editar manualmente: claves de pago que falten, Brevo, etc.
```

O manualmente:

```bash
cp infra/gcp/env.sandbox.example infra/gcp/.env.sandbox
openssl rand -base64 32   # JWT, COOKIE, REVALIDATE_SECRET, etc.
```

### C. Bootstrap + deploy

Scripts de arranque Git (una vez):

```bash
./scripts/setup-git-branches.sh   # push main, crear develop, protecciones, environments
```

```bash
chmod +x infra/gcp/*.sh
./infra/gcp/bootstrap-sandbox.sh
./infra/gcp/deploy-sandbox.sh
./infra/gcp/remap-domains-sandbox.sh
```

### D. Medusa Admin (sandbox)

1. Abre https://api.sbx.gorumin.com/app  
2. Crea usuario admin (primer arranque / seed)  
3. **Settings → Publishable API Keys** → crea key → cópiala en `.env.sandbox` como `MEDUSA_PUBLISHABLE_KEY`  
4. Re-deploy storefront: `./infra/gcp/deploy-sandbox.sh storefront`  
5. Admin → **Pasarelas** → elige pasarela activa (ePayco/Wompi/MP)  
6. Ejecuta sync: `./infra/gcp/sync-sandbox.sh`

### E. Webhooks en proveedores de pago

Registra en cada dashboard (modo test/sandbox):

| Proveedor | URL |
|-----------|-----|
| Mercado Pago | `https://api.sbx.gorumin.com/hooks/mercadopago` |
| Wompi | `https://api.sbx.gorumin.com/hooks/wompi` |
| ePayco | `https://api.sbx.gorumin.com/hooks/epayco` |
| Fazer | `https://api.sbx.gorumin.com/hooks/fazer` |

### F. Google OAuth (opcional)

En [Google Cloud Console](https://console.cloud.google.com/) → Credentials:

- Authorized redirect URI: `https://sbx.gorumin.com/api/auth/google/callback`  
- Usa el mismo `GOOGLE_CLIENT_ID` o crea un OAuth client separado para sandbox.

### G. GitHub (CI/CD opcional)

1. Crea rama `develop` si no existe: `git checkout -b develop && git push -u origin develop`  
2. En GitHub → **Settings → Environments**:
   - `sandbox` — secrets con valores de `.env.sandbox`  
   - `production` — secrets con valores de `.env.production`  
3. Workflow manual: **Actions → Deploy Sandbox** o **Deploy Production**

Secrets mínimos por environment (mismos nombres, valores distintos):

`GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WORKLOAD_IDP`, `GCP_DEPLOY_SA`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SQL_INSTANCE`, `MEDUSA_SERVICE`, `STOREFRONT_SERVICE`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `MEDUSA_BACKEND_URL`, `STOREFRONT_BASE_URL`, `MEDUSA_PUBLISHABLE_KEY`, `REVALIDATE_SECRET`, + integraciones.

### H. Redis (recomendado sandbox/prod)

Crea una base Upstash **separada** para sandbox y otra para prod. Añade `REDIS_URL` en cada `.env.*`.

---

## CI

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `ci.yaml` | PR/push a `main` y `develop` | lint + typecheck |
| `deploy.yaml` | manual | Deploy producción (requiere WIF) |
| `deploy-sandbox.yaml` | manual / push `develop` | Deploy sandbox |
| `uptime.yaml` | cron | health check prod |

---

## Postman

| Archivo | Entorno |
|---------|---------|
| `docs/postman/gorumin.local.postman_environment.json` | Local |
| `docs/postman/gorumin.sandbox.postman_environment.json` | Sandbox |
| `docs/postman/gorumin.production.postman_environment.json` | Producción |

---

## Reglas de oro

1. **Nunca** uses credenciales de producción en local o sandbox.  
2. **Nunca** apuntes sandbox a la DB de producción.  
3. **Nunca** commitees `infra/gcp/.env.production` ni `.env.sandbox`.  
4. Promoción de código: `feature → develop → main`, no saltar sandbox.  
5. Migraciones DB: Medusa ejecuta `db:migrate` al arrancar el contenedor; sandbox y prod migran **bases distintas**.

---

## Referencia rápida de archivos

```
infra/gcp/
  env.local.example      # mapa dev local
  env.sandbox.example    # plantilla sandbox → .env.sandbox
  env.production.example # plantilla prod → .env.production
  bootstrap.sh           # SQL prod
  bootstrap-sandbox.sh   # SQL sandbox
  init-sandbox-env.sh      # genera .env.sandbox
  deploy-prod.sh         # deploy (ENV_FILE configurable)
  deploy-sandbox.sh        # wrapper → .env.sandbox
  remap-domains.sh       # prod domains
  remap-domains-sandbox.sh
  sync-prod.sh / sync-sandbox.sh
```
