"use client"

import type { ReactNode } from "react"
import { CheckCircle2, Copy, Info, Unlink } from "lucide-react"
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
import type { Integration, IntegrationProvider, LinkCode } from "@/lib/api"

import { useLinkCodeIntegration } from "./use-link-code-integration"

export interface LinkCodeIntegrationCardProps {
  provider: IntegrationProvider
  name: string
  icon: ReactNode
  description: string
  intro: string
  codeStepLabel: string
  openStep: (code: LinkCode, expired: boolean, copy: (text: string) => void) => ReactNode
  linkedDescription: (integration: Integration) => ReactNode
  relinkLabel: string
  unlinkWarning: (integration: Integration) => string
  features: string[]
}

export function LinkCodeIntegrationCard({
  provider,
  name,
  icon,
  description,
  intro,
  codeStepLabel,
  openStep,
  linkedDescription,
  relinkLabel,
  unlinkWarning,
  features,
}: LinkCodeIntegrationCardProps) {
  const { integration, linked, linkCode, expired, secondsLeft, generating, unlinking, generateCode, unlink, cancelCode } =
    useLinkCodeIntegration(provider, name)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {linked && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              Vinculado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Consultando el estado de {name}...
          </div>
        ) : linked && linkCode === null ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{linkedDescription(integration)}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button onClick={generateCode} disabled={generating || unlinking} variant="outline">
                {generating && <Spinner className="mr-2" />}
                {relinkLabel}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" disabled={generating || unlinking} className="text-destructive">
                    {unlinking ? <Spinner className="mr-2" /> : <Unlink className="size-4 mr-2" />}
                    Desvincular
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Desvincular {name}?</AlertDialogTitle>
                    <AlertDialogDescription>{unlinkWarning(integration)}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={unlink}>Desvincular</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : linkCode === null ? (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{intro}</AlertDescription>
            </Alert>
            <Button onClick={generateCode} disabled={generating} className="w-full sm:w-auto">
              {generating && <Spinner className="mr-2" />}
              Vincular {name}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{codeStepLabel}</Label>
              <div className="flex gap-2">
                <Input value={formatCode(linkCode.code)} readOnly className="font-mono text-lg tracking-widest" />
                <Button variant="outline" size="icon" onClick={() => copy(linkCode.code)} disabled={expired}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {expired ? "El código venció." : `Vence en ${formatCountdown(secondsLeft)}`}
              </p>
            </div>

            {openStep(linkCode, expired, copy)}

            <div className="flex flex-wrap gap-2">
              {expired && (
                <Button onClick={generateCode} disabled={generating} variant="outline">
                  {generating && <Spinner className="mr-2" />}
                  Generar otro código
                </Button>
              )}
              {linked && (
                <Button onClick={cancelCode} variant="ghost">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">¿Qué podés hacer por {name}?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="size-3" /> {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export function formatLinkedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

function formatCode(code: string): string {
  return `${code.slice(0, 4)} ${code.slice(4)}`
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}
