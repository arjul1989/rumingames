# Configuración de correos con Brevo (Gorumin)

Gorumin envía correos transaccionales desde Medusa usando la **API de Brevo**.  
En local, sin `BREVO_API_KEY`, los emails se registran en la consola del backend.

## Correos activos

| Evento | Plantilla | Destinatario |
|--------|-----------|--------------|
| Registro de cuenta | `email-verification` | Cliente |
| Compra confirmada | `order-placed` | Cliente |
| Código digital listo | `digital-code-delivered` | Cliente |
| Fallo de fulfillment | `fulfillment-failed` | `ADMIN_ALERT_EMAIL` |
| Alertas operativas | `monitor-alert` | `ADMIN_ALERT_EMAIL` |

El HTML vive en `apps/medusa/src/lib/email/templates/`. El diseño usa fondo oscuro (#0b1326), acentos lavanda/cian y CTA verde, alineado con el storefront.

---

## 1. Configurar Brevo

### a) Dominio y remitente

1. Entra a [Brevo](https://app.brevo.com) → **Configuración → Remitentes y dominios**.
2. Añade y verifica el dominio `gorumin.com` (o el que uses).
3. Configura **SPF**, **DKIM** y **DMARC** según las instrucciones de Brevo.
4. Crea un remitente, por ejemplo:
   - Email: `noreply@gorumin.com`
   - Nombre: `Gorumin`

### b) API key

1. **Configuración → SMTP y API → API Keys**.
2. Crea una clave con permiso **Enviar emails transaccionales**.
3. Copia la clave (`xkeysib-...`).

> Usa la **API key**, no la contraseña SMTP, salvo que implementes relay SMTP por separado.

### c) (Opcional) Plantillas en el panel de Brevo

Por defecto Gorumin envía **HTML generado en código**. Si prefieres editar diseño en Brevo:

1. **Campañas → Plantillas transaccionales → Crear**.
2. Crea una plantilla por evento y anota el **ID numérico**.
3. Asigna los IDs en las variables de entorno `BREVO_TEMPLATE_*` (ver abajo).

Variables sugeridas para la plantilla **Compra confirmada** (`order-placed`):

| Variable Brevo | Descripción |
|----------------|-------------|
| `params.first_name` | Nombre del cliente |
| `params.display_id` | Número de orden |
| `params.total` | Total numérico |
| `params.currency_code` | Ej. `cop` |
| `params.order_url` | Enlace al detalle del pedido |

---

## 2. Variables de entorno (Medusa)

Añade en `apps/medusa/.env` (local) y en producción:

```env
# Brevo — correos transaccionales
BREVO_API_KEY=xkeysib-tu-clave-aqui
BREVO_FROM_EMAIL=noreply@gorumin.com
BREVO_SENDER_NAME=Gorumin
BREVO_REPLY_TO=soporte@gorumin.com

# Alertas internas (fulfillment, monitoreo)
ADMIN_ALERT_EMAIL=admin@gorumin.com

# URLs usadas en enlaces de los correos
MEDUSA_BACKEND_URL=https://api.gorumin.com
STOREFRONT_URL=https://gorumin.com

# Opcional: IDs de plantillas creadas en Brevo (si no se definen, se usa HTML del código)
BREVO_TEMPLATE_ORDER_PLACED=
BREVO_TEMPLATE_EMAIL_VERIFICATION=
BREVO_TEMPLATE_DIGITAL_CODE=
```

**Producción (GCP):** añade las mismas variables en `infra/gcp/.env.production` y en los secretos de Cloud Run / GitHub Actions.

---

## 3. Reiniciar Medusa

```bash
cd apps/medusa
pnpm dev   # o reinicia el servicio en producción
```

Si `BREVO_API_KEY` y `BREVO_FROM_EMAIL` están definidos, Medusa carga el provider `./src/modules/notification-brevo`.

---

## 4. Probar envío

### Registro (verificación de email)

1. Registra un usuario nuevo en el storefront.
2. Debe llegar **“Confirma tu correo en Gorumin”** con botón verde.

### Compra confirmada

1. Completa un checkout de prueba.
2. Al crearse la orden (`order.placed`), se envía **“¡Compra confirmada!”** con resumen de ítems y enlace a *Mis compras*.

### Código digital

1. Tras fulfillment exitoso (Fazer), el cliente recibe **“Tu código está listo”**.

### Local sin Brevo

Sin `BREVO_API_KEY`, revisa los logs de Medusa:

```text
Attempting to send a notification to: 'cliente@email.com' on the channel: 'email' with template: 'order-placed' ...
```

---

## 5. Diseño del email de compra

Estructura del correo **Compra confirmada**:

```
┌─────────────────────────────────────┐
│ GORUMIN (label cian, caps)          │
│ ¡Compra confirmada!                 │
├─────────────────────────────────────┤
│ Hola {nombre},                      │
│ Recibimos tu pedido #{display_id}.  │
│                                     │
│ [Tabla: producto | cant | total]    │
│ Total pagado: $XXX COP (verde)      │
│                                     │
│ ⚠ Aviso región / sin devoluciones   │
│                                     │
│      [ VER MI PEDIDO ]  (verde)     │
├─────────────────────────────────────┤
│ © Gorumin · gorumin.com             │
└─────────────────────────────────────┘
```

Colores de marca:

- Fondo: `#0b1326`
- Tarjeta: `#171f33`
- Texto: `#dae2fd` / `#cfc2d6`
- Acento: `#4cd7f6` (label) · `#22c55e` (CTA)

---

## 6. Monitorización en Brevo

En **Estadísticas → Email transaccional** puedes ver entregas, rebotes y aperturas.

Recomendaciones:

- Mantén `noreply@` solo para envío; usa `BREVO_REPLY_TO=soporte@...` para respuestas.
- No uses la misma API key en frontend.
- Si un dominio nuevo tiene baja reputación, empieza con volumen bajo y revisa rebotes.

---

## 7. Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| No llega ningún correo | API key o remitente no verificado | Revisa Brevo → Remitentes; prueba envío manual desde Brevo |
| Error `Brevo API 401` | API key inválida | Regenera clave y actualiza `BREVO_API_KEY` |
| Error `Brevo API 400` | Remitente no autorizado | Verifica dominio y email en `BREVO_FROM_EMAIL` |
| Solo logs en consola | Falta `BREVO_API_KEY` o `BREVO_FROM_EMAIL` | Completa ambas variables |
| HTML sin estilos en Gmail | Normal en algunos clientes | El layout usa tablas inline; prueba en Gmail y Outlook |

---

## 8. IPs autorizadas (si Brevo las solicita)

Gorumin envía correos con la **API REST de Brevo** (`POST https://api.brevo.com/v3/smtp/email`), no con SMTP relay. En muchos planes **no hace falta** whitelist de IPs para la API — basta la `BREVO_API_KEY`. Si Brevo te pide IPs igual (seguridad de cuenta o relay SMTP), usa esta referencia:

### Desarrollo local (tu máquina)

La IP pública de salida **cambia** si tu ISP usa IP dinámica. Para obtener la actual:

```bash
curl -s https://ifconfig.me
```

Ejemplo detectado en esta máquina: **`186.121.47.108`** — vuelve a ejecutar el comando antes de registrarla en Brevo.

### Producción (Cloud Run — `sims-499022`, `us-central1`)

Medusa corre en **Cloud Run** (`gorumin-medusa`). Por defecto **no hay IP fija de salida**: las peticiones a Brevo salen por el NAT compartido de Google (pool dinámico).

| Entorno | IP | Notas |
|---------|-----|--------|
| Cloud Run (actual) | **Dinámica** (pool Google) | No hay Cloud NAT ni IP estática configurada en el proyecto |
| `api.gorumin.com` | Entrada, no salida | La IP del dominio es distinta a la IP con la que Medusa llama a Brevo |

**Recomendación para producción:**

1. **Opción A (recomendada):** En Brevo → Seguridad, **no restrinjas por IP** la API key transaccional; protege solo con la clave secreta en Secret Manager.
2. **Opción B:** Si Brevo exige IP fija, configura **Cloud NAT + IP estática** en GCP y anota esa IP en Brevo (requiere VPC connector en Cloud Run).

Para descubrir la IP de salida real en prod (una vez desplegado), añade temporalmente un log en el provider Brevo o ejecuta un job en Cloud Run que haga `curl https://ifconfig.me`.

### GitHub Actions (deploy)

Los deploys usan runners de GitHub + `gcloud`; **no envían correos**. No necesitas whitelist para CI.

### Checklist Brevo

- [ ] Dominio `gorumin.com` verificado (SPF, DKIM, DMARC)
- [ ] Remitente `noreply@gorumin.com` autorizado
- [ ] `BREVO_API_KEY` en Medusa (prod + local)
- [ ] `MEDUSA_BACKEND_URL=https://api.gorumin.com` (enlace del correo de confirmación)
- [ ] Logo en GCS: `./infra/gcp/sync-email-assets.sh` → `EMAIL_LOGO_URL=https://storage.googleapis.com/gorumin-public-assets/email/gorumin-logo-256.png`
- [ ] IP local añadida en Brevo **solo si** activaste restricción por IP

---

## Archivos relevantes

- Provider Brevo: `apps/medusa/src/modules/notification-brevo/`
- Plantillas HTML: `apps/medusa/src/lib/email/templates/`
- Suscriptores: `apps/medusa/src/subscribers/`
- Config Medusa: `apps/medusa/medusa-config.ts`
