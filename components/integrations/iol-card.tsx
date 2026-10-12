"use client"

import { useEffect, useState, type FormEvent } from "react"
import { AlertTriangle, CheckCircle2, Info, LineChart, Unlink } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  getIntegration,
  isApiError,
  linkIol,
  NOT_LINKED,
  toastApiError,
  unlinkIntegration,
  type Integration,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

import { formatLinkedDate, LINKED_ICON_CLASS } from "./link-code-integration-card"

const PROVIDER = "iol"
const CREDENTIAL_MAX_LENGTH = 200

export function IolCard() {
  const t = useMessages()
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const linked = integration?.linked ?? false
  const failed = linked && integration?.status === "Error"

  useEffect(() => {
    const controller = new AbortController()

    getIntegration(PROVIDER, controller.signal)
      .then((current) => {
        setIntegration(current)
        if (current.status === "Error") setUsername(current.externalAccountId ?? "")
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, t.iol.statusFailed)
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [t])

  const link = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLinking(true)
    try {
      setIntegration(await linkIol(username.trim(), password))
      setUsername("")
      toast.success(t.iol.linkedToast)
    } catch (error) {
      const reason = isApiError(error) ? t.iol.linkErrors[error.code] : undefined
      if (reason) {
        toast.error(t.iol.linkFailedToast, { description: reason })
      } else {
        toastApiError(error, t.iol.linkFailedToast)
      }
    } finally {
      setPassword("")
      setLinking(false)
    }
  }

  const unlink = async () => {
    setUnlinking(true)
    try {
      await unlinkIntegration(PROVIDER)
      setIntegration(NOT_LINKED)
      setUsername("")
      toast.success(t.iol.unlinkedToast)
    } catch (error) {
      toastApiError(error, t.iol.unlinkFailed)
    } finally {
      setUnlinking(false)
    }
  }

  const busy = linking || unlinking

  const unlinkButton = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" disabled={busy} className="text-destructive">
          {unlinking ? <Spinner className="mr-2" /> : <Unlink className="size-4 mr-2" />}
          {t.common.unlink}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.iol.unlinkTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.iol.unlinkWarning}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={unlink}>{t.common.unlink}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  // autoComplete="new-password" evita que el navegador complete o guarde la contraseña de FinGrow en este campo.
  const credentialsForm = (
    <form onSubmit={link} autoComplete="off" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="iol-username">{t.iol.username}</Label>
          <Input
            id="iol-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="off"
            maxLength={CREDENTIAL_MAX_LENGTH}
            disabled={busy}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iol-password">{t.iol.password}</Label>
          <Input
            id="iol-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            maxLength={CREDENTIAL_MAX_LENGTH}
            disabled={busy}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !username.trim() || !password} className="w-full sm:w-auto gap-2">
          {linking ? <Spinner /> : <LineChart className="size-4" />}
          {failed ? t.iol.relink : t.iol.connect}
        </Button>
        {failed && unlinkButton}
      </div>
    </form>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <LineChart className="size-5 shrink-0 text-violet-500" />
            <div>
              <CardTitle>InvertirOnline (IOL)</CardTitle>
              <CardDescription>{t.iol.description}</CardDescription>
            </div>
          </div>
          {failed ? (
            <Badge variant="destructive" className="shrink-0 gap-1">
              <AlertTriangle className="size-3" />
              {t.iol.needsAttention}
            </Badge>
          ) : (
            linked && (
              <Badge variant="default" className="shrink-0 gap-1">
                <CheckCircle2 className="size-3" />
                {t.common.linked}
              </Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> {t.iol.checking}
          </div>
        ) : failed ? (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t.iol.expired}</AlertDescription>
            </Alert>
            {credentialsForm}
          </>
        ) : linked ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className={LINKED_ICON_CLASS} />
              <AlertDescription>
                {t.iol.linkedPrefix}
                <span className="font-mono">{integration.externalAccountId}</span>
                {t.iol.linkedMiddle}
                {integration.linkedAt && t.iol.linkedOn(formatLinkedDate(integration.linkedAt))}
                {t.iol.linkedSuffix}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">{unlinkButton}</div>
          </div>
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p>{t.iol.intro}</p>
                <p>{t.iol.requirement}</p>
              </AlertDescription>
            </Alert>
            {credentialsForm}
          </>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t.iol.whatItDoes}</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {t.iol.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 size-3 shrink-0" /> {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
