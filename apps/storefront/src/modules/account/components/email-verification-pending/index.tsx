import ResendVerificationButton from "@modules/account/components/resend-verification-button"

export default function EmailVerificationPending({
  email,
}: {
  email: string
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-12 text-center"
      data-testid="email-verification-pending"
    >
      <div className="hyper-glass w-full rounded-2xl p-8">
        <h1 className="font-display mb-2 text-2xl font-extrabold text-primary">
          Confirma tu correo
        </h1>
        <p className="text-base-regular text-on-surface-variant/70">
          Por seguridad, debes confirmar <strong>{email}</strong> antes de ver
          tus compras, códigos digitales o métodos de pago.
        </p>
        <p className="mt-4 text-sm text-on-surface-variant/60">
          Abre el enlace del correo &quot;Confirma tu correo en rumin&quot; y
          luego vuelve a iniciar sesión.
        </p>
        <ResendVerificationButton email={email} />
      </div>
    </div>
  )
}
