import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import GoogleAuthButton from "@modules/account/components/google-auth-button"
import ResendVerificationButton from "@modules/account/components/resend-verification-button"
import { useActionState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

const googleAuthErrors: Record<string, string> = {
  google_denied: "Inicio de sesión con Google cancelado.",
  google_failed: "No se pudo iniciar sesión con Google. Intenta de nuevo.",
  google_unavailable:
    "Google no está configurado en el servidor. Usa correo y contraseña.",
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleError = searchParams.get("error")
  const emailVerified = searchParams.get("email_verified")
  const oauthError = googleError ? googleAuthErrors[googleError] : null

  useEffect(() => {
    if (message?.state === "success") {
      router.refresh()
    }
  }, [message, router])

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="font-display mb-2 text-3xl font-extrabold text-primary">
        Bienvenido de nuevo
      </h1>
      <p className="text-center text-base-regular text-on-surface-variant/70 mb-8">
        Inicia sesión para acceder a tus órdenes y códigos.
      </p>
      {emailVerified === "success" && (
        <div
          className="hyper-glass w-full mb-6 text-center text-base-regular text-on-surface rounded-xl p-4 border border-secondary/30"
          data-testid="email-verified-success-message"
        >
          ¡Correo confirmado! Ya puedes iniciar sesión.
        </div>
      )}
      {emailVerified === "invalid" && (
        <div
          className="hyper-glass w-full mb-6 text-center text-base-regular text-on-surface rounded-xl p-4 border border-error/30"
          data-testid="email-verified-invalid-message"
        >
          El enlace de confirmación no es válido o expiró. Inicia sesión para
          recibir uno nuevo.
        </div>
      )}
      {message?.state === "verification_required" && (
        <div
          className="hyper-glass w-full mb-6 text-center text-base-regular text-on-surface rounded-xl p-4"
          data-testid="login-verification-message"
        >
          Enviamos un enlace de confirmación a <strong>{message.email}</strong>.
          Debes verificar tu correo antes de acceder a Mis compras o códigos.
          <ResendVerificationButton email={message.email} />
        </div>
      )}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Correo"
            name="email"
            type="email"
            title="Ingresa un correo válido."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={
            message?.state === "error"
              ? message.error
              : oauthError
          }
          data-testid="login-error-message"
        />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Entrar
        </SubmitButton>
      </form>
      {GOOGLE_AUTH_ENABLED && (
        <>
          <div className="relative w-full my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-on-surface/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-on-surface-variant/60">
                o
              </span>
            </div>
          </div>
          <GoogleAuthButton />
        </>
      )}
      <span className="text-center text-on-surface-variant/70 text-small-regular mt-6">
        ¿No tienes cuenta?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="text-secondary underline"
          data-testid="register-button"
        >
          Regístrate
        </button>
        .
      </span>
    </div>
  )
}

export default Login
