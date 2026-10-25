"use client"

import Image from "next/image"
import { AuthenticatedRedirect } from "@/components/home/authenticated-redirect"
import { CurrentYear } from "@/components/home/current-year"
import { LoginForm } from "@/components/home/login-form"
import { FINGROW_CONTACT_EMAIL } from "@/lib/contact"
import { useMessages } from "@/lib/i18n"

const leafColors = ["bg-[#559AC8]", "bg-[#7154B3]", "bg-[#FDA540]", "bg-[#F1573C]"]

export default function HomePage() {
  const t = useMessages().home

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.15fr_1fr]">
      <AuthenticatedRedirect />

      <aside className="p-3 lg:sticky lg:top-0 lg:h-screen">
        <div className="relative h-48 overflow-hidden rounded-3xl sm:h-64 lg:h-full">
          <Image
            src="/login-hero.webp"
            alt={t.heroAlt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-[30%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17132B]/95 via-[#17132B]/35 to-[#17132B]/20" />

          <div className="absolute inset-x-0 top-0 flex items-center gap-2.5 p-6 lg:p-10">
            <Image src="/9.png" alt="" width={34} height={36} className="h-9 w-auto" priority />
            <h1 className="text-2xl font-bold tracking-tight text-white">FinGrow</h1>
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden p-10 lg:block xl:p-14">
            <div className="flex w-28 gap-1.5" aria-hidden="true">
              {leafColors.map((color) => (
                <span key={color} className={`h-1.5 flex-1 rounded-full ${color}`} />
              ))}
            </div>
            <p className="mt-6 max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">
              {t.heroTitle}
            </p>
            <p className="mt-4 max-w-md text-lg text-white/80">
              {t.heroSubtitle}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col px-6 pb-8 pt-6 sm:px-10 lg:min-h-screen lg:px-16 lg:py-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
            <LoginForm />

            <div className="mt-8 space-y-1.5 border-t pt-6 text-sm text-muted-foreground">
              <p>{t.noAccount}</p>
              <p>
                {t.areYouCompany}{" "}
                <a
                  href={`mailto:${FINGROW_CONTACT_EMAIL}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t.contactLink}
                </a>
              </p>
            </div>
          </div>
        </div>

        <footer className="pt-10 text-center text-xs text-muted-foreground">
          © <CurrentYear /> {t.footer}
        </footer>
      </main>
    </div>
  )
}
