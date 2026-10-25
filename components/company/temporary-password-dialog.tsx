"use client"

import { Copy, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CreatedEmployeeDto } from "@/lib/api"
import { useMessages, type Messages } from "@/lib/i18n"

async function copy(text: string, label: string, t: Messages["employees"]) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t.copied(label))
  } catch {
    toast.error(t.copyFailed)
  }
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const t = useMessages().employees

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">{value}</code>
        <Button type="button" variant="outline" size="icon" onClick={() => void copy(value, label, t)} aria-label={t.copyAria(label)}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function TemporaryPasswordDialog({
  created,
  onClose,
}: {
  created: CreatedEmployeeDto | null
  onClose: () => void
}) {
  const t = useMessages().employees

  return (
    <Dialog open={created !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        {created && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                {t.hasAccess(created.employee.fullName)}
              </DialogTitle>
              <DialogDescription>{t.credentialsHint}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <CredentialRow label={t.emailLabel} value={created.employee.email} />
              <CredentialRow label={t.temporaryPassword} value={created.temporaryPassword} />
              <Alert>
                <AlertDescription>{t.shownOnce}</AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button type="button" onClick={onClose}>
                {t.done}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
