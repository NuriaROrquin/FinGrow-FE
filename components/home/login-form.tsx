"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/lib/auth-context"
import { isApiError, toastApiError, TWO_FACTOR_CODE_LENGTH, type TwoFactorChallenge } from "@/lib/api"

export function LoginForm() {
  const { login, completeTwoFactorLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null)
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const pendingChallenge = await login(email, password)

      if (pendingChallenge) {
        setChallenge(pendingChallenge)
        setCode("")
        setIsLoading(false)
      }
    } catch (error) {
      toastApiError(error, error instanceof Error ? error.message : "Intentá nuevamente.", { showCode: false })
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || code.length !== TWO_FACTOR_CODE_LENGTH) return

    setIsLoading(true)

    try {
      await completeTwoFactorLogin(challenge.challengeToken, code)
    } catch (error) {
      toastApiError(error, "No pudimos verificar el código. Intentá nuevamente.", { showCode: false })
      setCode("")
      setIsLoading(false)

      if (isApiError(error) && error.code === "Auth.DesafioInvalido") {
        backToCredentials()
      }
    }
  }

  const backToCredentials = () => {
    setChallenge(null)
    setCode("")
    setPassword("")
  }

  if (challenge) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Verificación en dos pasos</CardTitle>
          <CardDescription className="text-center">
            Ingresá el código de 6 dígitos que muestra tu app de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                id="two-factor-code"
                maxLength={TWO_FACTOR_CODE_LENGTH}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="^[0-9]+$"
                autoFocus
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup>
                  {Array.from({ length: TWO_FACTOR_CODE_LENGTH }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || code.length !== TWO_FACTOR_CODE_LENGTH}
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={backToCredentials} disabled={isLoading}>
              Volver
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>Ingresá con el correo y la contraseña de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/recuperar-password" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
