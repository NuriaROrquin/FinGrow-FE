"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, KeyRound, Lock, Loader2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  isApiError,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_INVALID_LINK,
  resetPassword,
  toastApiError,
  validatePasswordResetToken,
} from "@/lib/api"
import { PasswordResetShell } from "./password-reset-shell"

type Step = "checking" | "invalid" | "form" | "done"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [step, setStep] = useState<Step>(token ? "checking" : "invalid")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) return

    let ignore = false

    validatePasswordResetToken(token)
      .then(() => {
        if (ignore) return
        setStep("form")
      })
      .catch((error) => {
        if (ignore) return
        if (!isApiError(error) || error.code !== PASSWORD_RESET_INVALID_LINK) {
          toastApiError(error, "No pudimos verificar el enlace. Intentá nuevamente.", { showCode: false })
        }
        setStep("invalid")
      })

    return () => {
      ignore = true
    }
  }, [token])

  const mismatch = confirmation.length > 0 && password !== confirmation
  const canSubmit = password.length >= PASSWORD_MIN_LENGTH && password === confirmation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsLoading(true)

    try {
      await resetPassword(token, password)
      setStep("done")
    } catch (error) {
      if (isApiError(error) && error.code === PASSWORD_RESET_INVALID_LINK) {
        setStep("invalid")
        return
      }

      toastApiError(error, "No pudimos cambiar la contraseña. Intentá nuevamente.", { showCode: false })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PasswordResetShell>
      {step === "checking" && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Verificando el enlace...</p>
          </CardContent>
        </Card>
      )}

      {step === "invalid" && (
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <TriangleAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">El enlace no sirve</CardTitle>
            <CardDescription className="text-center">
              Venció, ya se usó o no es válido. Pedí uno nuevo: cada enlace sirve una sola vez y vence en una hora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/recuperar-password">Pedir un enlace nuevo</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">Volver al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "form" && (
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Elegí una contraseña nueva</CardTitle>
            <CardDescription className="text-center">
              Al guardarla se cierran las sesiones abiertas en tus otros dispositivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña nueva</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    autoFocus
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repetí la contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                    aria-invalid={mismatch}
                    aria-describedby={mismatch ? "confirm-password-error" : undefined}
                    required
                  />
                </div>
                {mismatch && (
                  <p id="confirm-password-error" className="text-xs text-destructive">
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !canSubmit}>
                {isLoading ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Listo, ya podés entrar</CardTitle>
            <CardDescription className="text-center">
              Iniciá sesión con tu contraseña nueva. Si tenés activada la verificación en dos pasos, te va a pedir el
              código como siempre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/">Iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </PasswordResetShell>
  )
}
