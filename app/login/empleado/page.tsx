"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { User, Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/lib/auth-context"
import { isApiError, toastApiError, TWO_FACTOR_CODE_LENGTH, type TwoFactorChallenge } from "@/lib/api"

export default function EmpleadoLoginPage() {
  const router = useRouter()
  const { login, completeTwoFactorLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
        return
      }

      router.push("/dashboard")
    } catch (error) {
      toastApiError(error, error instanceof Error ? error.message : "Intentá nuevamente.", { showCode: false })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || code.length !== TWO_FACTOR_CODE_LENGTH) return

    setIsLoading(true)

    try {
      await completeTwoFactorLogin(challenge.challengeToken, code)
      router.push("/dashboard")
    } catch (error) {
      toastApiError(error, "No pudimos verificar el código. Intentá nuevamente.", { showCode: false })
      setCode("")

      if (isApiError(error) && error.code === "Auth.DesafioInvalido") {
        backToCredentials()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const backToCredentials = () => {
    setChallenge(null)
    setCode("")
    setPassword("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a inicio
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <Image
                src="/9.png"
                alt="FinGrow Logo"
                width={60}
                height={40}
                className="object-contain"
                priority
            />
            <h1 className="text-4xl font-bold text-secondary-foreground">FinGrow</h1>
          </div>
          <p className="text-muted-foreground">Portal de Empleados</p>
        </div>

        {/* Login Card */}
        {challenge ? (
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
        ) : (
          <Card>
            <CardHeader className="space-y-1">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary"/>
              </div>
              <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
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
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Demo Info */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo:</strong> Usa cualquier email y contraseña para acceder
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
