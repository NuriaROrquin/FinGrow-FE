"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/lib/auth-context"
import { isApiError, toastApiError, TWO_FACTOR_CODE_LENGTH, type TwoFactorChallenge } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

export function LoginForm() {
  const t = useMessages().login
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
      toastApiError(error, error instanceof Error ? error.message : t.tryAgain, { showCode: false })
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
      toastApiError(error, t.codeFailed, { showCode: false })
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
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight">{t.twoFactorTitle}</h2>
        <p className="mt-2 text-muted-foreground">{t.twoFactorDescription}</p>

        <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
          <InputOTP
            id="two-factor-code"
            maxLength={TWO_FACTOR_CODE_LENGTH}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="^[0-9]+$"
            autoFocus
            value={code}
            onChange={setCode}
            containerClassName="justify-between"
          >
            <InputOTPGroup className="w-full justify-between gap-2">
              {Array.from({ length: TWO_FACTOR_CODE_LENGTH }, (_, index) => (
                <InputOTPSlot key={index} index={index} className="h-12 w-12 rounded-xl border text-lg first:rounded-xl last:rounded-xl" />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base"
            disabled={isLoading || code.length !== TWO_FACTOR_CODE_LENGTH}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? t.verifying : t.verify}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-xl text-muted-foreground"
            onClick={backToCredentials}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight">{t.welcomeTitle}</h2>
      <p className="mt-2 text-muted-foreground">{t.welcomeDescription}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t.email}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl pl-11 text-base md:text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.password}</Label>
            <Link href="/recuperar-password" className="text-sm text-primary underline-offset-4 hover:underline">
              {t.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl px-11 text-base md:text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="group h-12 w-full rounded-xl text-base" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.signingIn}
            </>
          ) : (
            <>
              {t.signIn}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
