import { mockStorefrontBase } from "./index"
import { getMockMpPayment } from "./mp-mock-store"

export function renderMpSimulatorPage(params: {
  paymentId: string
  sessionId?: string
  orderId?: string
  countryCode?: string
}): string {
  const payment = getMockMpPayment(params.paymentId)
  const amount = payment?.transaction_amount ?? 0
  const method = payment?.payment_method_id ?? "mock"
  const status = payment?.status ?? "unknown"
  const cc = params.countryCode ?? "co"
  const orderId = params.orderId ?? ""
  const storefront = mockStorefrontBase()

  const returnSuccess = orderId
    ? `${storefront}/${cc}/order/${orderId}/confirmed`
    : `${storefront}/${cc}/account/orders`

  const returnFailure = orderId
    ? `${storefront}/${cc}/checkout/failure?order=${orderId}`
    : `${storefront}/${cc}/checkout/failure`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gorumin — Simulador Mercado Pago (local)</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif; background: #0b1326; color: #dae2fd; padding: 24px;
    }
    .card {
      width: 100%; max-width: 480px; background: #171f33; border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px; padding: 28px;
    }
    .badge {
      font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
      color: #4cd7f6; margin-bottom: 8px;
    }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 16px; color: #cfc2d6; line-height: 1.5; font-size: 14px; }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 13px; margin: 0 0 24px; }
    dt { color: #988d9f; }
    dd { margin: 0; color: #dae2fd; text-align: right; }
    .actions { display: flex; flex-direction: column; gap: 12px; }
    button {
      border: 0; border-radius: 8px; padding: 14px 20px; font-size: 14px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase;
    }
    .approve { background: #22c55e; color: #fff; }
    .reject { background: transparent; color: #ffb4ab; border: 1px solid rgba(255,180,171,0.45); }
    .note { margin-top: 20px; font-size: 12px; color: #988d9f; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Mock Mercado Pago · Solo local</div>
    <h1>Simular respuesta del banco</h1>
    <p>El pago quedó pendiente. Usa los botones para simular la confirmación o el rechazo del webhook de Mercado Pago.</p>
    <dl>
      <dt>Pago MP (mock)</dt><dd>#${params.paymentId}</dd>
      <dt>Sesión</dt><dd style="font-size:11px;word-break:break-all;">${params.sessionId ?? "—"}</dd>
      <dt>Método</dt><dd>${method}</dd>
      <dt>Monto</dt><dd>$${amount.toLocaleString("es-CO")} COP</dd>
      <dt>Estado</dt><dd>${status}</dd>
      ${orderId ? `<dt>Orden</dt><dd>${orderId}</dd>` : ""}
    </dl>
    <div class="actions">
      <form method="POST" action="/dev/mock-mp/approve">
        <input type="hidden" name="payment_id" value="${params.paymentId}" />
        <input type="hidden" name="order_id" value="${orderId}" />
        <input type="hidden" name="country_code" value="${cc}" />
        <input type="hidden" name="return_url" value="${returnSuccess}" />
        <button type="submit" class="approve" style="width:100%">Aprobar pago</button>
      </form>
      <form method="POST" action="/dev/mock-mp/reject">
        <input type="hidden" name="payment_id" value="${params.paymentId}" />
        <input type="hidden" name="return_url" value="${returnFailure}" />
        <button type="submit" class="reject" style="width:100%">Rechazar pago</button>
      </form>
    </div>
    <p class="note">Requiere MOCK_MP=true y NODE_ENV distinto de production. En producción usa el webhook real de Mercado Pago.</p>
  </div>
</body>
</html>`
}
