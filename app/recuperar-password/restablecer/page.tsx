import { Suspense } from "react"
import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/password-reset/reset-password-form"

export const metadata: Metadata = {
  title: "Restablecer contraseña - FinGrow",
  // El token viaja en la URL: que no se filtre en el Referer de ningún pedido que salga de esta página.
  referrer: "no-referrer",
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
