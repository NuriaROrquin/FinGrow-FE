"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import { TrendingUpIcon, TrendingDownIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, LightbulbIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

const mockPortfolio = [
  {
    id: 1,
    activo: "Fondo S&P 500",
    tipo: "ETF",
    monto: 2226000,
    rentabilidad: 1305,
    variacion: 5.87,
  },
  {
    id: 2,
    activo: "Apple Inc.",
    tipo: "Acción",
    monto: 456200.5,
    rentabilidad: 187.5,
    variacion: 4.11,
  },
  {
    id: 3,
    activo: "Tesla Inc.",
    tipo: "Acción",
    monto: 357300,
    rentabilidad: -114,
    variacion: -3.09,
  },
  {
    id: 4,
    activo: "Bonos del Tesoro",
    tipo: "Bono",
    monto: 798000,
    rentabilidad: 130,
    variacion: 1.66,
  },
  {
    id: 5,
    activo: "Fondo Común FCI",
    tipo: "Fondo Común",
    monto: 520000,
    rentabilidad: 312,
    variacion: 6.38,
  },
]

const performanceData = [
  { mes: "Ene", valor: 350000 },
  { mes: "Feb", valor: 362000 },
  { mes: "Mar", valor: 358000 },
  { mes: "Abr", valor: 375000 },
  { mes: "May", valor: 382000 },
  { mes: "Jun", valor: 435750.5 },
]

const allocationData = [
  { nombre: "Acciones", valor: 813500.5, color: "#3b5998" },
  { nombre: "ETFs", valor: 2226000, color: "#10b981" },
  { nombre: "Bonos", valor: 798000, color: "#f59e0b" },
  { nombre: "Fondos Comunes", valor: 520000, color: "#8b5cf6" },
]

const educationalTips = [
  {
    id: 1,
    titulo: "Cómo diversificar tu cartera",
    descripcion:
      "No pongas todos los huevos en la misma canasta. Distribuí tus inversiones entre diferentes tipos de activos para reducir el riesgo.",
    icon: LightbulbIcon,
  },
  {
    id: 2,
    titulo: "Qué es un fondo común de inversión",
    descripcion:
      "Los fondos comunes agrupan el dinero de muchos inversores para comprar una cartera diversificada de activos, gestionada por profesionales.",
    icon: LightbulbIcon,
  },
  {
    id: 3,
    titulo: "Inversión a largo plazo",
    descripcion:
      "El tiempo es tu aliado. Las inversiones a largo plazo tienden a generar mejores rendimientos y reducir el impacto de la volatilidad del mercado.",
    icon: LightbulbIcon,
  },
]

const chartConfig = {
  valor: {
    label: "Valor del Portafolio",
    color: "#8b5cf6",
  },
}

const allocationChartConfig = {
  Acciones: {
    label: "Acciones",
    color: "#3b5998",
  },
  ETFs: {
    label: "ETFs",
    color: "#10b981",
  },
  Bonos: {
    label: "Bonos",
    color: "#f59e0b",
  },
  "Fondos Comunes": {
    label: "Fondos Comunes",
    color: "#8b5cf6",
  },
}

export default function InvestmentsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const router = useRouter()

  const totalValue = mockPortfolio.reduce((sum, inv) => sum + inv.monto, 0)
  const totalGain = mockPortfolio.reduce((sum, inv) => sum + inv.rentabilidad, 0)
  const totalGainPercent = (totalGain / (totalValue - totalGain)) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inversiones</h1>
          <p className="text-muted-foreground mt-1">Gestioná y seguí el rendimiento de tus inversiones</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              Agregar Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Inversión</DialogTitle>
              <DialogDescription>Registrá una nueva inversión en tu portafolio</DialogDescription>
            </DialogHeader>
            <AddInvestmentForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total del Portafolio</CardDescription>
            <CardTitle className="text-2xl">${totalValue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-1 text-sm ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
              {totalGain >= 0 ? <ArrowUpIcon className="size-4" /> : <ArrowDownIcon className="size-4" />}
              <span>
                {totalGain >= 0 ? "+" : ""}${Math.abs(totalGain).toLocaleString()} ({totalGainPercent.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invertido</CardDescription>
            <CardTitle className="text-2xl">${(totalValue - totalGain).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{mockPortfolio.length} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cambio de Hoy</CardDescription>
            <CardTitle className="text-2xl text-success">+$342.50</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <TrendingUpIcon className="size-4" />
              <span>+0.89%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retorno Anual</CardDescription>
            <CardTitle className="text-2xl text-success">+12.4%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Año en curso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Columna principal con gráficos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gráfico de rendimiento histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Histórico</CardTitle>
              <CardDescription>Evolución del valor de tu portafolio en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }} />
                  <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Resumen por tipo de activo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Activo</CardTitle>
              <CardDescription>Cómo está distribuido tu portafolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ChartContainer config={allocationChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre, percent }: { nombre?: string; percent?: number }) =>
                        `${nombre} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="valor"
                      nameKey="nombre"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} cursor={false} />
                  </PieChart>
                </ChartContainer>

                <div className="flex flex-col justify-center gap-3">
                  {allocationData.map((item) => (
                    <div key={item.nombre} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.nombre}</span>
                      </div>
                      <span className="text-sm font-semibold">${item.valor.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LightbulbIcon className="size-5 text-primary" />
                Tips Educativos
              </CardTitle>
              <CardDescription>Aprendé más sobre inversiones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {educationalTips.map((tip) => (
                <div key={tip.id} className="p-3 rounded-lg bg-background border">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <tip.icon className="size-4 text-primary" />
                    {tip.titulo}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.descripcion}</p>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full bg-transparent"
                size="sm"
                onClick={() => router.push('/dashboard/education')}
              >
                Ver más recursos educativos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Cartera de Inversiones</CardTitle>
          <CardDescription>Detalle completo de tus activos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Rentabilidad</TableHead>
                <TableHead className="text-right">Variación %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPortfolio.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.activo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {investment.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${investment.monto.toLocaleString()}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${investment.rentabilidad >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {investment.rentabilidad >= 0 ? "+" : ""}${investment.rentabilidad.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${investment.variacion >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {investment.variacion >= 0 ? (
                        <TrendingUpIcon className="size-4" />
                      ) : (
                        <TrendingDownIcon className="size-4" />
                      )}
                      <span className="font-semibold">
                        {investment.variacion >= 0 ? "+" : ""}
                        {investment.variacion.toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AddInvestmentForm({ onClose }: { onClose: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inv-type">Tipo de Inversión</Label>
        <Select>
          <SelectTrigger id="inv-type">
            <SelectValue placeholder="Seleccioná el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accion">Acción</SelectItem>
            <SelectItem value="etf">ETF</SelectItem>
            <SelectItem value="bono">Bono</SelectItem>
            <SelectItem value="crypto">Criptomoneda</SelectItem>
            <SelectItem value="fondo">Fondo Común</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-name">Nombre del Activo</Label>
        <Input id="inv-name" placeholder="ej. Apple Inc." required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inv-amount">Monto Invertido</Label>
          <Input id="inv-amount" type="number" placeholder="0.00" step="0.01" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inv-price">Precio de Compra</Label>
          <Input id="inv-price" type="number" placeholder="0.00" step="0.01" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inv-date">Fecha de Compra</Label>
        <Input id="inv-date" type="date" required />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Agregar Inversión</Button>
      </div>
    </form>
  )
}
