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

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  } catch {
    toast.error("No se pudo copiar. Seleccionalo y copialo a mano.")
  }
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all">{value}</code>
        <Button type="button" variant="outline" size="icon" onClick={() => void copy(value, label)} aria-label={`Copiar ${label.toLowerCase()}`}>
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
  return (
    <Dialog open={created !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        {created && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                {created.employee.fullName} ya tiene acceso
              </DialogTitle>
              <DialogDescription>
                Pasale estas credenciales para que inicie sesión como empleado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <CredentialRow label="Email" value={created.employee.email} />
              <CredentialRow label="Contraseña temporal" value={created.temporaryPassword} />
              <Alert>
                <AlertDescription>
                  La contraseña temporal se muestra una sola vez: si cerrás esta ventana no se puede volver a ver.
                  El empleado puede cambiarla desde su configuración.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Listo
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
