"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ShieldIcon,
  LockIcon,
  TrashIcon,
  Send,
  ScanLine,
  Info,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useMessages } from "@/lib/i18n"
import { changePassword, PASSWORD_MIN_LENGTH, toastApiError } from "@/lib/api"
import { ProfileCard } from "@/components/profile/profile-card"
import { CompanyProfileCard } from "@/components/company/company-profile-card"
import { TwoFactorCard } from "@/components/security/two-factor-card"
import { ActiveSessionsCard } from "@/components/security/active-sessions-card"
import { WithdrawAccountDialog } from "@/components/security/withdraw-account-dialog"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { CompanyNotificationPreferences } from "@/components/notifications/company-notification-preferences"
import { PreferencesCard } from "@/components/preferences/preferences-card"
import { IolCard } from "@/components/integrations/iol-card"
import { GmailCard } from "@/components/integrations/gmail-card"
import { MercadoPagoCard } from "@/components/integrations/mercado-pago-card"
import { tabAfterLink } from "@/components/integrations/link-result"
import { TELEGRAM_BOT_USERNAME, TelegramCard } from "@/components/integrations/telegram-card"
import { WhatsAppCard } from "@/components/integrations/whatsapp-card"
import { useEffect, useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { toast as sonnerToast } from "sonner"

export default function SettingsPage() {
  const { role, logout } = useAuth()
  const t = useMessages()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => (tabAfterLink(searchParams) ?? searchParams.get("tab")) || "profile")
  useEffect(() => {
    const tab = tabAfterLink(searchParams) ?? searchParams.get("tab")
    if (tab) setActiveTab(tab)
  }, [searchParams])
  const visibleTab = role === "empresa" && activeTab === "integrations" ? "profile" : activeTab
  const [mounted, setMounted] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      sonnerToast.error(t.settings.security.passwordsDontMatch)
      return
    }

    if (newPassword === currentPassword) {
      sonnerToast.error(t.settings.security.passwordMustDiffer)
      return
    }

    setChangingPassword(true)

    try {
      await changePassword({ currentPassword, newPassword })
      sonnerToast.success(t.settings.security.passwordUpdated, { description: t.settings.security.passwordUpdatedDescription })
      await logout()
    } catch (error) {
      toastApiError(error, t.settings.security.passwordUpdateFailed, { showCode: false })
    } finally {
      setChangingPassword(false)
    }
  }

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">
          {role === "empleado" ? t.settings.subtitleEmployee : t.settings.subtitleCompany}
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={visibleTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t.settings.tabs.profile}</TabsTrigger>
          <TabsTrigger value="notifications">{t.settings.tabs.notifications}</TabsTrigger>
          {role === "empleado" && (
            <TabsTrigger value="integrations">{t.settings.tabs.integrations}</TabsTrigger>
          )}
          <TabsTrigger value="security">{t.settings.tabs.security}</TabsTrigger>
          <TabsTrigger value="preferences">{t.settings.tabs.preferences}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {role === "empleado" ? <ProfileCard /> : <CompanyProfileCard />}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {role === "empleado" ? (
            <NotificationPreferences />
          ) : (
            <CompanyNotificationPreferences />
          )}
        </TabsContent>

        {/* Integrations Tab */}
        {role === "empleado" && (
        <TabsContent value="integrations" className="space-y-4">
          <TelegramCard />

          <WhatsAppCard />

          <GmailCard />

          <MercadoPagoCard />

          <IolCard />

          {/* OCR Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScanLine className="size-5 text-purple-500" />
                <div>
                  <CardTitle>{t.settings.ocr.title}</CardTitle>
                  <CardDescription>{t.settings.ocr.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{t.settings.ocr.intro}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t.settings.ocr.howToTitle}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {t.settings.ocr.howTo.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" asChild>
                  <a href="/dashboard/transactions?mode=ocr">
                    <ScanLine className="size-4 mr-2" />
                    {t.settings.ocr.scanNow}
                  </a>
                </Button>
                {TELEGRAM_BOT_USERNAME ? (
                  <Button variant="outline" asChild>
                    <a href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} target="_blank" rel="noopener noreferrer">
                      <Send className="size-4 mr-2" />
                      {t.settings.ocr.sendByTelegram}
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Send className="size-4 mr-2" />
                    {t.settings.ocr.sendByTelegram}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldIcon className="size-5" />
                <div>
                  <CardTitle>{t.settings.security.title}</CardTitle>
                  <CardDescription>{t.settings.security.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <LockIcon className="size-4" />
                  {t.settings.security.changePassword}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t.settings.security.currentPassword}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.settings.security.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t.settings.security.minLength(PASSWORD_MIN_LENGTH)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.settings.security.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">{t.settings.security.sessionsWarning}</p>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? t.settings.security.updating : t.settings.security.update}
                </Button>
              </form>

              <Separator />
              <TwoFactorCard />

              <Separator />

              <ActiveSessionsCard />
            </CardContent>
          </Card>

          {role === "empleado" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrashIcon className="size-5 text-destructive" />
                  <div>
                    <CardTitle className="text-destructive">{t.settings.danger.title}</CardTitle>
                    <CardDescription>{t.settings.danger.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-medium">{t.settings.danger.deleteAccount}</p>
                    <p className="text-sm text-muted-foreground">{t.settings.danger.deleteAccountHint}</p>
                  </div>
                  <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
                    {t.settings.danger.delete}
                  </Button>
                </div>
              </CardContent>
              <WithdrawAccountDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <PreferencesCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
