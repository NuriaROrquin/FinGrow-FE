"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { KeyRound, Mail, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { parsePasswordResetRole, requestPasswordReset, toastApiError } from "@/lib/api"
import { PasswordResetShell } from "./password-reset-shell"

export function RequestPasswordResetForm() {
  const role = parsePasswordResetRole(useSearchParams().get("tipo"))
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await requestPasswordReset(role, email.trim())
      setSentTo(email.trim())
    } catch (error) {
      toastApiError(error, "No pudimos procesar el pedido. Intentá nuevamente.", { showCode: false })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PasswordResetShell role={role}>
      {sentTo ? (
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Revisá tu correo</CardTitle>
            <CardDescription className="text-center">
              {/* El mismo mensaje exista o no la cuenta: no revelamos qué emails están registrados. */}
              Si <strong className="text-foreground">{sentTo}</strong> corresponde a una cuenta activa, te mandamos un
              enlace para elegir una contraseña nueva. Sirve una sola vez y vence en una hora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              ¿No llegó? Revisá la carpeta de spam o pedí otro enlace en un minuto.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href={`/login/${role}`}>Volver al inicio de sesión</Link>
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setSentTo(null)}>
              Usar otro email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription className="text-center">
              Ingresá tu email y te mandamos un enlace para elegir una nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{role === "empresa" ? "Correo Corporativo" : "Correo Electrónico"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={role === "empresa" ? "admin@empresa.com" : "tu@email.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </PasswordResetShell>
  )
}
