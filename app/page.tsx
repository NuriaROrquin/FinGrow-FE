"use client"

import Link from "next/link"
import { Building2, User } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthenticatedRedirect } from "@/components/home/authenticated-redirect"
import { CurrentYear } from "@/components/home/current-year"
import { FINGROW_CONTACT_EMAIL } from "@/lib/contact"
import { useMessages } from "@/lib/i18n"

export default function HomePage() {
  const t = useMessages().home

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AuthenticatedRedirect />
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
                src="/9.png"
                alt={t.logoAlt}
                width={80}
                height={60}
                className="object-contain"
                priority
            />
            <h1 className="text-5xl font-bold text-secondary-foreground">FinGrow</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.tagline}</p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Employee Card */}
          <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t.employeeTitle}</CardTitle>
              <CardDescription className="text-base">{t.employeeDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {t.employeeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login/empleado" className="block">
                <Button className="w-full" size="lg">
                  {t.signIn}
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-4">
                {t.employeeCredentials}
              </p>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t.companyTitle}</CardTitle>
              <CardDescription className="text-base">{t.companyDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {t.companyFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login/empresa" className="block">
                <Button className="w-full" size="lg">
                  {t.signIn}
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-4">
                <a href={`mailto:${FINGROW_CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {t.contactLink}
                </a>
                {t.contactSuffix}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>
            © <CurrentYear /> {t.footer}
          </p>
        </div>
      </div>
    </div>
  )
}
