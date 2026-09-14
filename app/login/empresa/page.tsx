"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Building2, Mail, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { mockLogin } from "@/lib/api/mock-auth"

export default function EmpresaLoginPage() {
  const router = useRouter()
  const { loginWithToken } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { token } = await mockLogin({ email, password })
      if (!loginWithToken(token)) {
        throw new Error("El token recibido no es válido")
      }
      router.push("/dashboard/company")
    } finally {
      setIsLoading(false)
    }
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
          <p className="text-muted-foreground">Portal Empresarial</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary"/>
            </div>
            <CardTitle className="text-2xl text-center">Acceso Empresarial</CardTitle>
            <CardDescription className="text-center">Ingresa las credenciales de tu empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@empresa.com"
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
                {isLoading ? "Iniciando sesión..." : "Acceder al Panel"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes acceso? Contacta al equipo de FinGrow para obtener credenciales empresariales.
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Demo:</strong> Usa cualquier email corporativo y contraseña para acceder
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground text-center mb-3">
            Beneficios del Portal Empresarial:
          </p>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Métricas anónimas de bienestar financiero
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Análisis por departamento y tendencias
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Recomendaciones para mejorar el bienestar
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
