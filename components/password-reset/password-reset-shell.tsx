import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PasswordResetShellProps {
  children: React.ReactNode
}

/** El mismo marco que los logins, para que recuperar la contraseña se sienta parte del mismo portal. */
export function PasswordResetShell({ children }: PasswordResetShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>

        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <Image src="/9.png" alt="FinGrow Logo" width={60} height={40} className="object-contain" priority />
            <h1 className="text-4xl font-bold text-secondary-foreground">FinGrow</h1>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
