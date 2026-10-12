"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BellIcon,
  ShieldIcon,
  LockIcon,
  TrashIcon,
  CheckCircle2,
  Mail,
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
import { PreferencesCard } from "@/components/preferences/preferences-card"
import { IolCard } from "@/components/integrations/iol-card"
import { LINKED_ICON_CLASS } from "@/components/integrations/link-code-integration-card"
import { MercadoPagoCard } from "@/components/integrations/mercado-pago-card"
import { TelegramCard } from "@/components/integrations/telegram-card"
import { WhatsAppCard } from "@/components/integrations/whatsapp-card"
import { useEffect, useState, type FormEvent } from "react"
import { toast as sonnerToast } from "sonner"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { role, logout } = useAuth()
  const t = useMessages()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

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
      await logout(`/login/${role}`)
    } catch (error) {
      toastApiError(error, t.settings.security.passwordUpdateFailed, { showCode: false })
    } finally {
      setChangingPassword(false)
    }
  }

  // Estados para las integraciones
  const [gmailLinked, setGmailLinked] = useState(false)

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLinkGmail = () => {
    setGmailLinked(true)
    toast({
      title: t.settings.gmail.linkedToastTitle,
      description: t.settings.gmail.linkedToastDescription,
    })
  }

  const handleUnlinkGmail = () => {
    setGmailLinked(false)
    toast({
      title: t.settings.gmail.unlinkedToastTitle,
      description: t.settings.gmail.unlinkedToastDescription,
    })
  }

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
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t.settings.tabs.profile}</TabsTrigger>
          <TabsTrigger value="notifications">{t.settings.tabs.notifications}</TabsTrigger>
          <TabsTrigger value="integrations">{t.settings.tabs.integrations}</TabsTrigger>
          <TabsTrigger value="security">{t.settings.tabs.security}</TabsTrigger>
          <TabsTrigger value="preferences">{t.settings.tabs.preferences}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {role === "empleado" ? <ProfileCard /> : <CompanyProfileCard />}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BellIcon className="size-5" />
                <div>
                  <CardTitle>{t.settings.notifications.title}</CardTitle>
                  <CardDescription>{t.settings.notifications.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {role === "empleado" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.budgetAlerts}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.budgetAlertsHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.transactions}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.transactionsHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.goals}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.goalsHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.investments}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.investmentsHint}</p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.education}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.educationHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.wellbeing}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.wellbeingHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.newEmployees}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.newEmployeesHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.monthlyReports}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.monthlyReportsHint}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t.settings.notifications.participation}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.participationHint}</p>
                    </div>
                    <Switch />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.settings.notifications.email}</Label>
                  <p className="text-sm text-muted-foreground">{t.settings.notifications.emailHint}</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button>{t.settings.notifications.save}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <TelegramCard />

          <WhatsAppCard />

          {/* Gmail Integration */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Mail className="size-5 shrink-0 text-red-500" />
                  <div>
                    <CardTitle>Gmail</CardTitle>
                    <CardDescription>{t.settings.gmail.description}</CardDescription>
                  </div>
                </div>
                {gmailLinked && (
                  <Badge variant="default" className="shrink-0 gap-1">
                    <CheckCircle2 className="size-3" />
                    {t.common.linked}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!gmailLinked ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{t.settings.gmail.intro}</AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t.settings.gmail.detectedTitle}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {t.settings.gmail.detected.map((service) => (
                        <li key={service}>• {service}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button onClick={handleLinkGmail} className="w-full sm:w-auto gap-2">
                      <Mail className="size-4" />
                      {t.settings.gmail.connect}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-red-500 flex items-center justify-center">
                        <Mail className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">usuario@gmail.com</p>
                        <p className="text-sm text-muted-foreground">{t.settings.gmail.syncActive}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleUnlinkGmail}>
                      {t.common.unlink}
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle2 className={LINKED_ICON_CLASS} />
                    <AlertDescription>{t.settings.gmail.syncInfo}</AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t.settings.gmail.processedTitle}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>{t.settings.gmail.processed.electricity}</span>
                        <span className="font-medium">$4,500</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>{t.settings.gmail.processed.gas}</span>
                        <span className="font-medium">$2,300</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>{t.settings.gmail.processed.internet}</span>
                        <span className="font-medium">$8,900</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
                <Button variant="outline" disabled>
                  <Send className="size-4 mr-2" />
                  {t.settings.ocr.sendByTelegram}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

              <div className="space-y-4">
                <h3 className="font-semibold">{t.settings.security.activeSessions}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{t.settings.security.currentSession}</p>
                      <p className="text-sm text-muted-foreground">{t.settings.security.currentSessionDevice}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t.settings.security.revoke}
                    </Button>
                  </div>
                </div>
              </div>
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
                  <Button variant="destructive">{t.settings.danger.delete}</Button>
                </div>
              </CardContent>
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
