import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

import { localizedAlternates, SITE_NAME } from "@lib/seo"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: `Accede a tu cuenta ${SITE_NAME}.`,
  alternates: localizedAlternates("account"),
}

export default function Login() {
  return <LoginTemplate />
}
