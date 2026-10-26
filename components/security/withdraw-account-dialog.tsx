"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { BarChart3, Building2, PiggyBank, Plug, Receipt, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toastApiError, withdrawAccount } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

function ListItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

/** Baja del empleado (HU-74): explica qué se borra y qué no, y la confirma con la contraseña. */
export function WithdrawAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const messages = useMessages()
  const t = messages.settings.danger
  const { logout } = useAuth()
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (pending) return
    if (!next) setPassword("")
    onOpenChange(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)

    try {
      await withdrawAccount(password)
    } catch (error) {
      toastApiError(error, t.failed, { showCode: false })
      setPending(false)
      return
    }

    toast.success(t.done, { description: t.doneDescription })
    // El backend ya borró la cookie y revocó las sesiones: logout solo limpia el estado local.
    await logout("/")
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[520px]">
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogDescription} <strong className="text-foreground">{t.cannotUndo}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-2 font-medium text-foreground">{t.erasedTitle}</p>
              <ul className="space-y-1.5 text-muted-foreground [&_svg]:text-destructive">
                <ListItem icon={<Receipt className="h-4 w-4" />}>{t.erasedTransactions}</ListItem>
                <ListItem icon={<PiggyBank className="h-4 w-4" />}>{t.erasedBudgetsGoals}</ListItem>
                <ListItem icon={<TrendingUp className="h-4 w-4" />}>{t.erasedInvestments}</ListItem>
                <ListItem icon={<Plug className="h-4 w-4" />}>{t.erasedIntegrations}</ListItem>
              </ul>
            </div>

            <div className="rounded-md border bg-muted/50 p-3">
              <p className="mb-2 font-medium text-foreground">{t.keptTitle}</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <ListItem icon={<BarChart3 className="h-4 w-4" />}>{t.keptMetrics}</ListItem>
                <ListItem icon={<Building2 className="h-4 w-4" />}>{t.keptPayroll}</ListItem>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <Label htmlFor="withdraw-account-password">{t.passwordLabel}</Label>
              <Input
                id="withdraw-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
                required
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              {messages.common.cancel}
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={!password || pending}>
              {pending ? t.confirming : t.confirm}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
