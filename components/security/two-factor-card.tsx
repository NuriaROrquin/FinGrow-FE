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
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  isApiError,
  setupTwoFactor,
  toastApiError,
  TWO_FACTOR_CODE_LENGTH,
  type TwoFactorSetup,
} from "@/lib/api"

export function TwoFactorCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState("")
  const [starting, setStarting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [askingDisableCode, setAskingDisableCode] = useState(false)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    getTwoFactorStatus(controller.signal)
      .then((status) => setEnabled(status.enabled))
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, "No pudimos consultar el estado del doble factor.")
        setEnabled(false)
      })

    return () => controller.abort()
  }, [])

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

      toastApiError(error, "No pudimos generar el código QR.")
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
      setCode("")
      toast.success("Doble factor activado", {
        description: "Desde ahora te vamos a pedir el código de la app al iniciar sesión.",
      })
    } catch (error) {
      toastApiError(error, "No pudimos activar el doble factor.", { showCode: false })
      setCode("")
    } finally {
      setConfirming(false)
    }
  }

  const disable = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length !== TWO_FACTOR_CODE_LENGTH) return

    setDisabling(true)

    try {
      await disableTwoFactor(code)
      setEnabled(false)
      setAskingDisableCode(false)
      toast.success("Doble factor desactivado", {
        description: "Ya no te vamos a pedir el código al iniciar sesión.",
      })
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setEnabled(false)
        setAskingDisableCode(false)
        return
      }

      toastApiError(error, "No pudimos desactivar el doble factor.", { showCode: false })
    } finally {
      setCode("")
      setDisabling(false)
    }
  }

  const cancelDisable = () => {
    setAskingDisableCode(false)
    setCode("")
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success("Clave copiada al portapapeles")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Autenticación de Dos Factores
        </h3>
        {enabled && (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="size-3" />
            Activo
          </Badge>
        )}
      </div>

      {enabled === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Consultando el estado del doble factor...
        </div>
      ) : enabled ? (
        <>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Al iniciar sesión, además de la contraseña te pedimos el código de 6 dígitos de tu app de autenticación.
            </AlertDescription>
          </Alert>

          {askingDisableCode ? (
            <form onSubmit={disable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="two-factor-disable-code">
                  Para desactivarlo, ingresá el código que muestra tu app de autenticación
                </Label>
                <InputOTP
                  id="two-factor-disable-code"
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

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={disabling || code.length !== TWO_FACTOR_CODE_LENGTH}
                >
                  {disabling && <Spinner className="mr-2" />}
                  Desactivar doble factor
                </Button>
                <Button type="button" variant="ghost" onClick={cancelDisable} disabled={disabling}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setAskingDisableCode(true)} className="w-full sm:w-auto">
              Desactivar doble factor
            </Button>
          )}
        </>
      ) : setup === null ? (
        <>
          <p className="text-sm text-muted-foreground">
            Agregá una capa extra de seguridad: además de la contraseña, al iniciar sesión vas a necesitar un código
            que genera tu celular con Google Authenticator, Microsoft Authenticator o Authy.
          </p>
          <Button onClick={start} disabled={starting} className="w-full sm:w-auto">
            {starting && <Spinner className="mr-2" />}
            Activar doble factor
          </Button>
        </>
      ) : (
        <form onSubmit={confirm} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              1. Escaneá el código QR con tu app de autenticación. 2. Ingresá el código de 6 dígitos que te muestra
              para confirmar.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-lg border bg-white p-3">
              <QRCodeSVG value={setup.provisioningUri} size={168} />
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="two-factor-secret">¿No podés escanearlo? Ingresá esta clave a mano</Label>
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
            <Label htmlFor="two-factor-confirm-code">Código de verificación</Label>
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
              Confirmar y activar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSetup(null)} disabled={confirming}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}