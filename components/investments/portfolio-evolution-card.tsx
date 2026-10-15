"use client"

import { useEffect, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  getPortfolioEvolution,
  toastApiError,
  type PortfolioEvolutionDto,
  type PortfolioEvolutionPointDto,
  type PortfolioEvolutionRange,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import {
  formatDate,
  formatDateText,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercentage,
} from "@/lib/format"

const ranges: { value: PortfolioEvolutionRange; label: string; description: string }[] = [
  { value: "OneMonth", label: "1M", description: "Último mes" },
  { value: "ThreeMonths", label: "3M", description: "Últimos 3 meses" },
  { value: "SixMonths", label: "6M", description: "Últimos 6 meses" },
  { value: "OneYear", label: "1A", description: "Último año" },
  { value: "All", label: "Todo", description: "Desde tu primera inversión" },
]

const chartConfig = {
  value: { label: "Valor del portafolio", color: "var(--chart-1)" },
  investedAmount: { label: "Capital invertido", color: "var(--muted-foreground)" },
} satisfies ChartConfig

const daysShownByDay = 186

function TooltipResult({ point, currency }: { point: PortfolioEvolutionPointDto; currency: Currency }) {
  const result = point.value - point.investedAmount
  const percentage = point.investedAmount === 0 ? 0 : (result / point.investedAmount) * 100

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-1.5">
      <span className="text-muted-foreground">Resultado</span>
      <span className={`font-mono font-medium tabular-nums ${result >= 0 ? "text-success" : "text-destructive"}`}>
        {formatSignedMoney(result, currency)} ({formatSignedPercentage(percentage)})
      </span>
    </div>
  )
}

function EvolutionNotes({ evolution, range }: { evolution: PortfolioEvolutionDto; range: PortfolioEvolutionRange }) {
  const historyStart =
    range !== "All" && evolution.points[0]?.date === evolution.historyStartsOn ? evolution.historyStartsOn : null

  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
      <p>Cada día suma el último valor conocido de cada activo: los que todavía no cotizan figuran al costo.</p>
      {historyStart && (
        <p>
          Tu historial en {evolution.currency} empieza el {formatDate(historyStart)}, con tu primera compra.
        </p>
      )}
      {evolution.interval === "Week" && <p>Como abarca más de un año, se muestra un punto por semana.</p>}
    </div>
  )
}

export function PortfolioEvolutionCard({
  currencies,
  refreshKey,
}: {
  currencies: Currency[] | null
  refreshKey: number
}) {
  const [range, setRange] = useState<PortfolioEvolutionRange>("ThreeMonths")
  const [chosenCurrency, setChosenCurrency] = useState<Currency | "">("")
  const [evolution, setEvolution] = useState<PortfolioEvolutionDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const currency = currencies?.includes(chosenCurrency as Currency) ? (chosenCurrency as Currency) : currencies?.[0]

  useEffect(() => {
    if (!currency) return

    const controller = new AbortController()
    setIsLoading(true)

    getPortfolioEvolution(currency, range, controller.signal)
      .then((loaded) => {
        setEvolution(loaded)
        setLoadFailed(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setLoadFailed(true)
        toastApiError(error, "No se pudo cargar la evolución de tu portafolio.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, range, refreshKey])

  const points = evolution?.points ?? []
  const showsMonths = evolution?.interval === "Week" || points.length > daysShownByDay

  const renderContent = () => {
    if (currencies !== null && currencies.length === 0) {
      return <p className="text-sm text-muted-foreground">Todavía no registraste inversiones</p>
    }

    if (loadFailed && !isLoading) {
      return <p className="text-sm text-muted-foreground">No pudimos cargar la evolución. Probá de nuevo en un rato.</p>
    }

    if (currencies === null || !evolution) {
      return <Skeleton className="h-[300px] w-full" />
    }

    if (points.length < 2) {
      return (
        <p className="text-sm text-muted-foreground">
          Tu portafolio en {evolution.currency} empezó hoy: su evolución se empieza a ver a partir de mañana.
        </p>
      )
    }

    return (
      <>
        <ChartContainer
          config={chartConfig}
          className={`h-[300px] w-full transition-opacity ${isLoading ? "opacity-60" : ""}`}
        >
          <ComposedChart data={points} margin={{ left: 4, right: 12 }}>
            <defs>
              <linearGradient id="portfolio-evolution-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(date: string) =>
                formatDateText(date, showsMonths ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" })
              }
            />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(amount: number) => formatNumber(amount, { notation: "compact", maximumFractionDigits: 1 })}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  className="min-w-[14rem]"
                  labelFormatter={(date) => formatDateText(String(date), { day: "numeric", month: "long", year: "numeric" })}
                  formatter={(amount, name, item, _index, point) => (
                    <div className="flex w-full flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        <span className="flex-1 text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatMoney(Number(amount), evolution.currency)}
                        </span>
                      </div>
                      {name === "investedAmount" && point && (
                        <TooltipResult
                          point={point as unknown as PortfolioEvolutionPointDto}
                          currency={evolution.currency}
                        />
                      )}
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              fill="url(#portfolio-evolution-fill)"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="investedAmount"
              stroke="var(--color-investedAmount)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
        <EvolutionNotes evolution={evolution} range={range} />
      </>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución del Portafolio</CardTitle>
        <CardDescription>Cuánto valieron tus inversiones frente al capital que pusiste</CardDescription>
        {currency && currencies && currencies.length > 1 && (
          <CardAction>
            <Select value={currency} onValueChange={(selected) => setChosenCurrency(selected as Currency)}>
              <SelectTrigger className="w-[100px]" aria-label="Moneda de la evolución">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {currencies !== null && currencies.length > 0 && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={range}
            onValueChange={(value) => {
              if (value) setRange(value as PortfolioEvolutionRange)
            }}
            aria-label="Rango de la evolución"
            className="mb-4"
          >
            {ranges.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={option.description}
                title={option.description}
                className="flex-none px-3"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {renderContent()}
      </CardContent>
    </Card>
  )
}
