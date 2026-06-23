# Migración gorumin.com: eSIM (sim-web) → Gorumin (Medusa + Next.js)

## Inventario actual (proyecto `sims-499022`)

| Recurso | Nombre | Acción |
|---------|--------|--------|
| Cloud Run | `sim-web` | **Eliminar** tras cutover (sitio eSIM/Zendit/Supabase) |
| Cloud Run | `gorumin-medusa` | **Crear** — backend Medusa :9000 |
| Cloud Run | `gorumin-storefront` | **Crear** — Next.js :8000 |
| Domain mapping | `gorumin.com` → sim-web | **Remapear** → gorumin-storefront |
| Domain mapping | `www.gorumin.com` → sim-web | **Remapear** → gorumin-storefront |
| Domain mapping | `api.gorumin.com` | **Crear** → gorumin-medusa |
| Artifact Registry | `sim` (429 MB) | **Eliminar** |
| Artifact Registry | `gorumin` | **Crear** |
| Cloud SQL | — | **Crear** `gorumin-db` (Postgres 15) |

## ¿Proyecto nuevo o reutilizar?

**Recomendación: reutilizar `sims-499022`.**

- `gorumin.com` ya tiene SSL y verificación de dominio en Cloud Run.
- No hay que tocar DNS en el registrador (A/CNAME ya apuntan a Google).
- Solo se reemplaza el servicio detrás del dominio y se borra `sim-web`.

Crear un proyecto GCP nuevo implicaría re-verificar el dominio, reconfigurar DNS y duplicar billing.

## Pasos de migración

```bash
# 1. Bootstrap (APIs, Artifact Registry, Cloud SQL)
chmod +x infra/gcp/*.sh
./infra/gcp/bootstrap.sh

# 2. Configurar secrets de producción
cp infra/gcp/env.production.example infra/gcp/.env.production
# Editar: DB_PASSWORD (del bootstrap), JWT/COOKIE/DIGITAL keys, MP, FAZER

# 3. Deploy
./infra/gcp/deploy-prod.sh both

# 4. Crear publishable key en Medusa Admin → Settings → Publishable API Keys
#    Pegar en .env.production → MEDUSA_PUBLISHABLE_KEY
#    Re-deploy storefront:
./infra/gcp/deploy-prod.sh storefront

# 5. Remapear dominios
./infra/gcp/remap-domains.sh
# Si api.gorumin.com es nuevo, añadir el CNAME que indique gcloud

# 6. Verificar https://gorumin.com/co y https://api.gorumin.com/health

# 7. Eliminar legado
./infra/gcp/cleanup-sim-web.sh
```

## GitHub Actions (CI/CD automático)

El workflow `.github/workflows/deploy.yaml` requiere estos secrets en GitHub:

| Secret | Valor |
|--------|-------|
| `GCP_PROJECT_ID` | `sims-499022` |
| `GCP_REGION` | `us-central1` |
| `GCP_WORKLOAD_IDP` | Workload Identity Federation provider |
| `GCP_DEPLOY_SA` | Service account de deploy |
| `MEDUSA_PUBLISHABLE_KEY` | pk_… |
| `MEDUSA_BACKEND_URL` | `https://api.gorumin.com` |
| `STOREFRONT_BASE_URL` | `https://gorumin.com` |

WIF aún no está configurado en el proyecto; hasta entonces usar `deploy-prod.sh` manual.

## Seguridad post-migración

El servicio `sim-web` tenía credenciales en variables de entorno planas (Supabase, Zendit, Mercado Pago, dLocal). **Rótalas** después de eliminar `sim-web`, aunque ya no estén expuestas en Cloud Run.

## Redis (opcional MVP)

Medusa arranca sin `REDIS_URL` (modo in-memory). Para producción con tráfico real, añade Upstash Redis o Memorystore y re-deploy Medusa con `REDIS_URL` en `.env.production`.
