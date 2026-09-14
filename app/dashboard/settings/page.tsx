"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  UserIcon,
  BellIcon,
  ShieldIcon,
  PaletteIcon,
  DollarSignIcon,
  LockIcon,
  TrashIcon,
  BuildingIcon,
  CheckCircle2,
  Mail,
  Send,
  ScanLine,
  Copy,
  ExternalLink,
  Info,
  Wallet,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { role } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  // Estados para las integraciones
  const [telegramLinked, setTelegramLinked] = useState(false)
  const [gmailLinked, setGmailLinked] = useState(false)
  const [mercadoPagoLinked, setMercadoPagoLinked] = useState(false)
  const [telegramCode, setTelegramCode] = useState("")
  const [telegramUsername, setTelegramUsername] = useState("")
  const [mercadoPagoEmail, setMercadoPagoEmail] = useState("")

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
    // Simular generación de código de verificación para Telegram
    setTelegramCode(Math.random().toString(36).substring(2, 10).toUpperCase())
  }, [])

  const handleLinkTelegram = () => {
    setTelegramLinked(true)
    setTelegramUsername("@usuario_demo")
    toast({
      title: "¡Telegram vinculado!",
      description: "Ahora recibirás notificaciones en tu celular",
    })
  }

  const handleUnlinkTelegram = () => {
    setTelegramLinked(false)
    setTelegramUsername("")
    toast({
      title: "Telegram desvinculado",
      description: "Ya no recibirás notificaciones en Telegram",
    })
  }

  const handleLinkGmail = () => {
    setGmailLinked(true)
    toast({
      title: "¡Gmail vinculado!",
      description: "Tus facturas serán procesadas automáticamente",
    })
  }

  const handleUnlinkGmail = () => {
    setGmailLinked(false)
    toast({
      title: "Gmail desvinculado",
      description: "Ya no se procesarán facturas automáticamente",
    })
  }

  const handleLinkMercadoPago = () => {
    setMercadoPagoLinked(true)
    setMercadoPagoEmail("usuario@ejemplo.com")
    toast({
      title: "¡Mercado Pago vinculado!",
      description: "Ahora puedes recibir pagos y enviar dinero fácilmente",
    })
  }

  const handleUnlinkMercadoPago = () => {
    setMercadoPagoLinked(false)
    setMercadoPagoEmail("")
    toast({
      title: "Mercado Pago desvinculado",
      description: "Ya no puedes recibir pagos ni enviar dinero desde la app",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado al portapapeles",
      description: "El código ha sido copiado",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          {role === "empleado" ? "Administra tu cuenta y preferencias" : "Administra la configuración empresarial"}
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {role === "empleado" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UserIcon className="size-5" />
                  <div>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Actualiza tus datos personales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" placeholder="Juan" defaultValue="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" placeholder="Pérez" defaultValue="Pérez" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan.perez@ejemplo.com"
                    defaultValue="juan.perez@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <Input id="phone" type="tel" placeholder="+54 11 1234-5678" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input id="dni" placeholder="12345678" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input id="birthDate" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" placeholder="Av. Corrientes 1234, CABA" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Cambios</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BuildingIcon className="size-5" />
                  <div>
                    <CardTitle>Información Empresarial</CardTitle>
                    <CardDescription>Actualiza los datos de tu empresa</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Razón Social</Label>
                  <Input id="companyName" placeholder="Mi Empresa S.A." defaultValue="Mi Empresa S.A." />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input id="cuit" placeholder="30-12345678-9" defaultValue="30-12345678-9" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industria</Label>
                    <Select defaultValue="tech">
                      <SelectTrigger id="industry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Tecnología</SelectItem>
                        <SelectItem value="finance">Finanzas</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufactura</SelectItem>
                        <SelectItem value="services">Servicios</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email Corporativo</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="contacto@miempresa.com"
                    defaultValue="contacto@miempresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Teléfono Corporativo</Label>
                  <Input id="companyPhone" type="tel" placeholder="+54 11 4000-0000" />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección Fiscal</Label>
                  <Input id="companyAddress" placeholder="Av. Libertador 5000, CABA" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Cantidad de Empleados</Label>
                    <Input id="employeeCount" type="number" placeholder="50" defaultValue="50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Año de Fundación</Label>
                    <Input id="foundedYear" type="number" placeholder="2010" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Cambios</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BellIcon className="size-5" />
                <div>
                  <CardTitle>Preferencias de Notificaciones</CardTitle>
                  <CardDescription>Elige qué notificaciones deseas recibir</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {role === "empleado" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Presupuesto</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones cuando te acerques a los límites de presupuesto
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificaciones de Transacciones</Label>
                      <p className="text-sm text-muted-foreground">Recibe alertas de nuevas transacciones</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Actualizaciones de Metas de Ahorro</Label>
                      <p className="text-sm text-muted-foreground">Sigue el progreso de tus metas de ahorro</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Actualizaciones de Inversiones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones sobre cambios en tu portafolio
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contenido Educativo</Label>
                      <p className="text-sm text-muted-foreground">Recibe nuevos cursos y artículos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Bienestar Financiero</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones sobre cambios en el bienestar financiero de empleados
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nuevos Empleados Registrados</Label>
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando un empleado se registra en la plataforma
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reportes Mensuales</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe reportes mensuales de métricas empresariales
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Participación</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones sobre cambios en la tasa de participación
                      </p>
                    </div>
                    <Switch />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones vía correo electrónico</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button>Guardar Preferencias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {/* Telegram Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Send className="size-5 text-blue-500" />
                  <div>
                    <CardTitle>Telegram Bot</CardTitle>
                    <CardDescription>Recibe notificaciones y registra gastos mediante Telegram</CardDescription>
                  </div>
                </div>
                {telegramLinked && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Vinculado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!telegramLinked ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Vincula tu cuenta de Telegram para recibir notificaciones en tiempo real y registrar
                      gastos/ingresos mediante mensajes en lenguaje natural.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paso 1: Busca nuestro bot en Telegram</Label>
                      <div className="flex gap-2">
                        <Input value="@fingrowapp_bot" readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard("@fingrowapp_bot")}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="outline" asChild>
                          <a href="https://t.me/fingrowapp_bot" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4 mr-2" />
                            Abrir
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Paso 2: Envía este código al bot</Label>
                      <div className="flex gap-2">
                        <Input value={telegramCode} readOnly className="font-mono text-lg" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(telegramCode)}>
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este código vinculará tu cuenta con el bot
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button onClick={handleLinkTelegram} className="w-full sm:w-auto">
                        Vincular Telegram
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">¿Qué puedes hacer con Telegram?</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Recibir notificaciones de transacciones y alertas</li>
                      <li>• Registrar gastos: &quot;Gasté $500 en supermercado&quot;</li>
                      <li>• Registrar ingresos: &quot;Ingreso de $10000 por freelance&quot;</li>
                      <li>• Enviar fotos de tickets para procesarlos con OCR</li>
                      <li>• Consultar tu balance actual</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Send className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{telegramUsername}</p>
                        <p className="text-sm text-muted-foreground">Cuenta vinculada</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleUnlinkTelegram}>
                      Desvincular
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Tu cuenta está vinculada. Ahora puedes enviar mensajes como:
                      <br />
                      <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                        &quot;Pagué $1500 en el almuerzo con el equipo&quot;
                      </code>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Gmail Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-red-500" />
                  <div>
                    <CardTitle>Gmail</CardTitle>
                    <CardDescription>Procesa automáticamente facturas de servicios</CardDescription>
                  </div>
                </div>
                {gmailLinked && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Vinculado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!gmailLinked ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Conecta tu cuenta de Gmail para importar automáticamente facturas de luz, gas,
                      agua, internet y otros servicios.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Servicios que detectaremos:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Facturas de electricidad (Edenor, Edesur, EPE)</li>
                      <li>• Facturas de gas (MetroGAS, Camuzzi)</li>
                      <li>• Facturas de agua (AySA, ABSA)</li>
                      <li>• Internet y telefonía (Fibertel, Movistar, Personal)</li>
                      <li>• Otros servicios recurrentes</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button onClick={handleLinkGmail} className="w-full sm:w-auto gap-2">
                      <Mail className="size-4" />
                      Conectar con Gmail
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
                        <p className="text-sm text-muted-foreground">Sincronización activa</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleUnlinkGmail}>
                      Desvincular
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Tus facturas se procesarán automáticamente. Última sincronización: hace 5 minutos.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Facturas procesadas este mes:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>Edenor - Electricidad</span>
                        <span className="font-medium">$4,500</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>MetroGAS - Gas Natural</span>
                        <span className="font-medium">$2,300</span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 border rounded">
                        <span>Fibertel - Internet</span>
                        <span className="font-medium">$8,900</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mercado Pago Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="size-5 text-cyan-500" />
                  <div>
                    <CardTitle>Mercado Pago</CardTitle>
                    <CardDescription>Sincronizá los movimientos que realizás en Mercado Pago de forma automática</CardDescription>
                  </div>
                </div>
                {mercadoPagoLinked && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Vinculado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mercadoPagoLinked ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Vincula tu cuenta de Mercado Pago para empezar a sincronizar tus movimientos de forma automática.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="mercadoPagoEmail">Email de Mercado Pago</Label>
                    <Input
                      id="mercadoPagoEmail"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={mercadoPagoEmail}
                      onChange={(e) => setMercadoPagoEmail(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button onClick={handleLinkMercadoPago} className="w-full sm:w-auto gap-2">
                      <Wallet className="size-4" />
                      Vincular Mercado Pago
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Wallet className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{mercadoPagoEmail}</p>
                        <p className="text-sm text-muted-foreground">Cuenta vinculada</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleUnlinkMercadoPago}>
                      Desvincular
                    </Button>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Tu cuenta de Mercado Pago está vinculada. Los movimientos se sincronizan automáticamente cada hora.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* OCR Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScanLine className="size-5 text-purple-500" />
                <div>
                  <CardTitle>Procesamiento OCR</CardTitle>
                  <CardDescription>Escanea tickets y facturas con tu cámara</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Usa la función de OCR para escanear tickets de compras y extraer automáticamente
                  el monto y la categoría del gasto.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Cómo usar OCR:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Toma una foto del ticket o factura</li>
                  <li>• Envíala por Telegram o súbela en la sección de transacciones</li>
                  <li>• El sistema extraerá automáticamente los datos</li>
                  <li>• Confirma o edita la información antes de guardar</li>
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" asChild>
                  <a href="/dashboard/transactions?mode=ocr">
                    <ScanLine className="size-4 mr-2" />
                    Escanear ahora
                  </a>
                </Button>
                <Button variant="outline" disabled>
                  <Send className="size-4 mr-2" />
                  Enviar por Telegram
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
                  <CardTitle>Configuración de Seguridad</CardTitle>
                  <CardDescription>Administra la seguridad de tu cuenta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <LockIcon className="size-4" />
                  Cambiar Contraseña
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Actualizar Contraseña</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Autenticación de Dos Factores</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar 2FA</Label>
                    <p className="text-sm text-muted-foreground">Agrega una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Sesiones Activas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">Sesión Actual</p>
                      <p className="text-sm text-muted-foreground">Chrome en MacOS • Buenos Aires, Argentina</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Revocar
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
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>Acciones irreversibles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-medium">Eliminar Cuenta</p>
                    <p className="text-sm text-muted-foreground">Elimina permanentemente tu cuenta y todos los datos</p>
                  </div>
                  <Button variant="destructive">Eliminar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <PaletteIcon className="size-5" />
                <div>
                  <CardTitle>Apariencia</CardTitle>
                  <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {theme === "system"
                    ? "El tema se ajusta automáticamente según la configuración de tu sistema"
                    : theme === "dark"
                    ? "Tema oscuro activado"
                    : "Tema claro activado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select defaultValue="es">
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">Inglés</SelectItem>
                    <SelectItem value="pt">Portugués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSignIcon className="size-5" />
                <div>
                  <CardTitle>Preferencias Financieras</CardTitle>
                  <CardDescription>Configura tus ajustes financieros</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select defaultValue="ars">
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ars">ARS ($)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="brl">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Formato de Fecha</Label>
                <Select defaultValue="dmy">
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dmy">DD/MM/AAAA</SelectItem>
                    <SelectItem value="mdy">MM/DD/AAAA</SelectItem>
                    <SelectItem value="ymd">AAAA-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "empleado" && (
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Inicio de Año Fiscal</Label>
                  <Select defaultValue="jan">
                    <SelectTrigger id="fiscalYear">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan">Enero</SelectItem>
                      <SelectItem value="apr">Abril</SelectItem>
                      <SelectItem value="jul">Julio</SelectItem>
                      <SelectItem value="oct">Octubre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button>Guardar Preferencias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
