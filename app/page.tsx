import Link from "next/link"
import { Building2, User } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthenticatedRedirect } from "@/components/home/authenticated-redirect"
import { CurrentYear } from "@/components/home/current-year"
import { FINGROW_CONTACT_EMAIL } from "@/lib/contact"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AuthenticatedRedirect />
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
                src="/9.png"
                alt="FinGrow Logo"
                width={80}
                height={60}
                className="object-contain"
                priority
            />
            <h1 className="text-5xl font-bold text-secondary-foreground">FinGrow</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Plataforma de bienestar financiero para individuos y empresas
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Employee Card */}
          <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Soy Empleado</CardTitle>
              <CardDescription className="text-base">
                Gestiona tus finanzas personales, presupuestos y objetivos de ahorro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Control de gastos e ingresos
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Presupuestos y metas de ahorro
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Seguimiento de inversiones
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Educación financiera personalizada
                </li>
              </ul>
              <Link href="/login/empleado" className="block">
                <Button className="w-full" size="lg">
                  Iniciar Sesión
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Tu empresa te proporcionará las credenciales de acceso
              </p>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Soy Empresa</CardTitle>
              <CardDescription className="text-base">
                Monitorea el bienestar financiero de tus empleados de forma anónima
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Métricas agregadas de bienestar
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Análisis por departamento
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Tendencias de participación
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Recomendaciones personalizadas
                </li>
              </ul>
              <Link href="/login/empresa" className="block">
                <Button className="w-full" size="lg">
                  Iniciar Sesión
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-4">
                <a href={`mailto:${FINGROW_CONTACT_EMAIL}`} className="text-primary hover:underline">
                  Contactá a FinGrow
                </a>{" "}
                para obtener acceso empresarial
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>© <CurrentYear /> FinGrow. Plataforma de educación y bienestar financiero.</p>
        </div>
      </div>
    </div>
  )
}
