# Monitoreo GCP — Gorumin (RUM-67)

Alertas operativas para `gorumin-medusa` en Google Cloud. La app emite eventos
estructurados JSON en stdout con la clave `gorumin_monitor: true` (ver
`apps/medusa/src/lib/monitoring.ts`). Cloud Logging los ingiere automáticamente
desde Cloud Run.

## Eventos monitorizados

| `event_type` | Severidad | Cuándo |
|---|---|---|
| `fulfillment.failed` | ERROR | Fallo de entrega digital tras reintentos |
| `payment.webhook.error` | WARNING/ERROR | Firma MP inválida o error de procesamiento |
| `fazer.balance.low` | WARNING | Saldo Fazer por debajo del umbral |
| `health.check.failed` | CRITICAL | `/health` detecta DB/Redis caído |

## 1. Uptime check (HTTP)

Sustituye `MEDUSA_URL` por la URL pública del backend (Cloud Run o staging).

```bash
export PROJECT_ID="your-gcp-project"
export MEDUSA_URL="https://api.gorumin.com"

gcloud monitoring uptime create https-uptime-gorumin-medusa \
  --project="$PROJECT_ID" \
  --display-name="Gorumin Medusa /health" \
  --resource-type=uptime-url \
  --host="$(echo $MEDUSA_URL | sed -E 's|https?://||' | cut -d/ -f1)" \
  --path="/health" \
  --period=60 \
  --timeout=10s
```

Alternativa sin GCP: el workflow `.github/workflows/uptime.yaml` hace ping cada
15 minutos a la URL configurada en GitHub Secrets (`MEDUSA_HEALTH_URL`).

## 2. Log-based metrics

Filtro base para eventos Gorumin en Cloud Logging:

```
jsonPayload.gorumin_monitor=true
resource.type="cloud_run_revision"
resource.labels.service_name="gorumin-medusa"
```

Crear métricas (ejemplos):

```bash
gcloud logging metrics create gorumin_fulfillment_failed \
  --project="$PROJECT_ID" \
  --description="Fulfillment failures" \
  --log-filter='jsonPayload.gorumin_monitor=true AND jsonPayload.event_type="fulfillment.failed"'

gcloud logging metrics create gorumin_mp_webhook_error \
  --project="$PROJECT_ID" \
  --description="Mercado Pago webhook errors" \
  --log-filter='jsonPayload.gorumin_monitor=true AND jsonPayload.event_type="payment.webhook.error"'

gcloud logging metrics create gorumin_fazer_balance_low \
  --project="$PROJECT_ID" \
  --description="Fazer low balance" \
  --log-filter='jsonPayload.gorumin_monitor=true AND jsonPayload.event_type="fazer.balance.low"'
```

## 3. Alert policies (email)

Crea una notification channel de email en Cloud Console → Monitoring → Alerting,
luego asocia políticas que disparen cuando la métrica supere 0 en 5 minutos.

También puedes usar el script:

```bash
./infra/gcp/setup-monitoring.sh your-gcp-project admin@gorumin.com
```

## 4. Variables de entorno

| Variable | Uso |
|---|---|
| `ADMIN_ALERT_EMAIL` | Email operador para alertas (además de Cloud Logging) |
| `FAZER_BALANCE_ALERT_THRESHOLD` | Umbral USD para alerta de saldo (default 50) |

## 5. Health check local

```bash
curl -s http://localhost:9000/health | jq
# status: ok | degraded
# checks.database, checks.redis
```

Respuesta `503` cuando una dependencia crítica falla — ideal para uptime monitors.
