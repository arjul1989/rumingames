"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginView = () => {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get("view")
  const [currentView, setCurrentView] = useState(
    viewParam === "register" ? LOGIN_VIEW.REGISTER : LOGIN_VIEW.SIGN_IN
  )

  useEffect(() => {
    if (viewParam === "register") {
      setCurrentView(LOGIN_VIEW.REGISTER)
    } else if (viewParam === "sign-in" || !viewParam) {
      setCurrentView(LOGIN_VIEW.SIGN_IN)
    }
  }, [viewParam])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-12">
      <div className="hyper-glass w-full rounded-2xl p-8">
        {currentView === LOGIN_VIEW.SIGN_IN ? (
          <Login setCurrentView={setCurrentView} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>
    </div>
  )
}

const LoginTemplate = () => {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  )
}

export default LoginTemplate
