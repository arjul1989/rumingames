# Simuladores locales (Mercado Pago + Fazer)

Mocks para probar checkout end-to-end **sin webhooks reales ni llamadas a Fazer**.  
Solo funcionan cuando `NODE_ENV !== production` y las flags están en `true`.

## Variables

En `apps/medusa/.env`:

```env
MOCK_MP=true
MOCK_FAZER=true
MEDUSA_BACKEND_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:8000
```

| Variable | Efecto |
|----------|--------|
| `MOCK_MP=true` | La API de Mercado Pago (crear/consultar pago) es en memoria. Tras pagar, redirige al simulador local. |
| `MOCK_FAZER=true` | `createOrder` / `getOrder` devuelven al instante un código `MOCK-XXXX-XXXX` completado. El catálogo Fazer sigue usando la API real si tienes `FAZER_API_KEY`. |

Reinicia Medusa después de cambiar las flags.

---

## Flujo Mercado Pago mock

1. Checkout normal con el Payment Brick (puedes usar credenciales TEST de MP para el UI).
2. Al completar el carrito, el pago queda **pending** y el navegador va a:

   `http://localhost:9000/dev/mock-mp?payment_id=…&session_id=…&order_id=…`

3. En la página mock:
   - **Aprobar pago** → dispara el webhook interno → captura → fulfillment Fazer → redirige a la orden confirmada.
   - **Rechazar pago** → simula rechazo → redirige a checkout/failure.

No necesitas ngrok ni configurar webhooks de MP en local cuando `MOCK_MP=true`.

**Tarjetas con MOCK_MP:** el brick tokeniza (o usa datos de prueba), Medusa crea un pago mock en estado `pending`, completa la orden y redirige a `/dev/mock-mp`. Ahí eliges **Aprobar pago** para capturar y activar el fulfillment.

### Tarjetas de prueba (Colombia)

El Payment Brick separa **crédito** y **débito**. La tarjeta debe coincidir con la pestaña elegida; si no, verás `payment_method_not_in_allowed_types`.

| Pestaña | Visa (ejemplo) | CVV | Vencimiento |
|---------|----------------|-----|-------------|
| Tarjeta de crédito | `4509 9535 6623 3704` | `123` | `11/30` |
| Tarjeta de débito | `4916 1100 0000 0000` | `123` | `11/30` |

Titular sugerido: `APRO`.

En local sobre **HTTP**, el brick puede fallar al tokenizar tarjetas. Opciones:

- Storefront con HTTPS: `cd apps/storefront && pnpm dev:https` (acepta el certificado local).
- O `MOCK_MP=true` en Medusa para simular aprobación/rechazo sin depender del token de tarjeta real.

---

## Flujo Fazer mock

Con `MOCK_FAZER=true`, cuando el pago se captura (`payment.captured`):

- No se llama a `api.fzr.cards` para crear la orden.
- Se genera un código de prueba, se guarda cifrado y aparece en **Mis compras**.
- El email de “código listo” se envía igual (Brevo o consola).

---

## Producción

Las rutas `/dev/mock-mp/*` responden **404** en production.  
No definas `MOCK_MP` ni `MOCK_FAZER` en prod — usa Mercado Pago y Fazer reales (ya configurados).

---

## Archivos

- Mock MP store: `apps/medusa/src/lib/dev-mocks/mp-mock-store.ts`
- Simulador UI: `apps/medusa/src/api/dev/mock-mp/`
- Mock Fazer: `apps/medusa/src/modules/fazer/lib/mock-client.ts`
