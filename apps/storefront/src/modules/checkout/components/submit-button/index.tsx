"use client"

import { Button } from "@modules/common/components/ui"
import clsx from "clsx"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  size = "medium",
  className,
  tone = "default",
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | null
  size?: "small" | "medium" | "large"
  className?: string
  tone?: "default" | "checkout"
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  if (tone === "checkout") {
    return (
      <button
        type="submit"
        disabled={pending}
        data-testid={dataTestId}
        className={clsx("checkout-cta", className)}
      >
        {pending ? "Cargando…" : children}
      </button>
    )
  }

  return (
    <Button
      size={size}
      className={className}
      type="submit"
      isLoading={pending}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
