import { Suspense } from "react"
import type { Metadata } from "next"
import { RequestPasswordResetForm } from "@/components/password-reset/request-password-reset-form"

export const metadata: Metadata = {
  title: "Recuperar contraseña - FinGrow",
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense>
      <RequestPasswordResetForm />
    </Suspense>
  )
}
