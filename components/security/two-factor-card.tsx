"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CheckCircle2, Copy, Info, ShieldCheck } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  enableTwoFactor,
  getTwoFactorStatus,
  isApiError,
  setupTwoFactor,
  toastApiError,
  TWO_FACTOR_CODE_LENGTH,
  type TwoFactorSetup,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

export function TwoFactorCard() {
  const t = useMessages()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState("")
  const [starting, setStarting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getTwoFactorStatus(controller.signal)
      .then((status) => setEnabled(status.enabled))
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, t.twoFactor.statusFailed)
        setEnabled(false)
      })

    return () => controller.abort()
  }, [t])

  const start = async () => {
    setStarting(true)

    try {
      setSetup(await setupTwoFactor())
      setCode("")
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setEnabled(true)
        return
      }

      toastApiError(error, t.twoFactor.qrFailed)
    } finally {
      setStarting(false)
    }
  }

  const confirm = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length !== TWO_FACTOR_CODE_LENGTH) return

    setConfirming(true)

    try {
      await enableTwoFactor(code)
      setEnabled(true)
      setSetup(null)
      toast.success(t.twoFactor.enabledToast, {
        description: t.twoFactor.enabledToastDescription,
      })
    } catch (error) {
      toastApiError(error, t.twoFactor.enableFailed, { showCode: false })
      setCode("")
    } finally {
      setConfirming(false)
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success(t.twoFactor.secretCopied)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {t.twoFactor.title}
        </h3>
        {enabled && (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" />
            {t.twoFactor.active}
          </Badge>
        )}
      </div>

      {enabled === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> {t.twoFactor.checking}
        </div>
      ) : enabled ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{t.twoFactor.enabledInfo}</AlertDescription>
        </Alert>
      ) : setup === null ? (
        <>
          <p className="text-sm text-muted-foreground">{t.twoFactor.intro}</p>
          <Button onClick={start} disabled={starting} className="w-full sm:w-auto">
            {starting && <Spinner className="mr-2" />}
            {t.twoFactor.enable}
          </Button>
        </>
      ) : (
        <form onSubmit={confirm} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t.twoFactor.steps}</AlertDescription>
          </Alert>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-lg border bg-white p-3">
              <QRCodeSVG value={setup.provisioningUri} size={168} />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="two-factor-secret">{t.twoFactor.manualKey}</Label>
              <div className="flex gap-2">
                <code
                  id="two-factor-secret"
                  className="flex-1 break-all rounded-md border bg-muted px-3 py-2 font-mono text-sm tracking-wider"
                >
                  {setup.secret}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={() => copySecret(setup.secret)}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="two-factor-confirm-code">{t.twoFactor.code}</Label>
            <InputOTP
              id="two-factor-confirm-code"
              maxLength={TWO_FACTOR_CODE_LENGTH}
              inputMode="numeric"
              pattern="^[0-9]+$"
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

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={confirming || code.length !== TWO_FACTOR_CODE_LENGTH}>
              {confirming && <Spinner className="mr-2" />}
              {t.twoFactor.confirm}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSetup(null)} disabled={confirming}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
