import Image from "next/image"
import { AuthenticatedRedirect } from "@/components/home/authenticated-redirect"
import { CurrentYear } from "@/components/home/current-year"
import { LoginForm } from "@/components/home/login-form"
import { FINGROW_CONTACT_EMAIL } from "@/lib/contact"

const audiences = [
  {
    title: "Para empleados",
    benefits: ["Control de gastos e ingresos", "Presupuestos y metas de ahorro", "Seguimiento de inversiones", "Educación financiera personalizada"],
  },
  {
    title: "Para empresas",
    benefits: ["Métricas agregadas de bienestar", "Análisis por departamento", "Tendencias de participación", "Recomendaciones personalizadas"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AuthenticatedRedirect />
      <div className="container mx-auto flex min-h-screen flex-col px-4 py-10">
        <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="space-y-6 text-center lg:text-left">
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <Image src="/9.png" alt="FinGrow Logo" width={56} height={58} className="object-contain" priority />
              <h1 className="text-4xl font-bold text-secondary-foreground lg:text-5xl">FinGrow</h1>
            </div>
            <p className="mx-auto max-w-md text-lg text-muted-foreground lg:mx-0">
              Plataforma de bienestar financiero para individuos y empresas
            </p>
            <div className="hidden gap-6 pt-4 lg:grid lg:grid-cols-2">
              {audiences.map((audience) => (
                <div key={audience.title} className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{audience.title}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {audience.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md lg:mr-0">
            <LoginForm />
            <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
              <p>¿No tenés cuenta? Tu empresa te da el acceso.</p>
              <p>
                ¿Sos una empresa?{" "}
                <a href={`mailto:${FINGROW_CONTACT_EMAIL}`} className="text-primary hover:underline">
                  Contactá a FinGrow
                </a>
              </p>
            </div>
          </section>
        </main>

        <footer className="mt-10 text-center text-sm text-muted-foreground">
          <p>© <CurrentYear /> FinGrow. Plataforma de educación y bienestar financiero.</p>
        </footer>
      </div>
    </div>
  )
}
