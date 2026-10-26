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
import { useMessages } from "@/lib/i18n"

const ranges: PortfolioEvolutionRange[] = ["OneMonth", "ThreeMonths", "SixMonths", "OneYear", "All"]

const daysShownByDay = 186

function TooltipResult({ point, currency }: { point: PortfolioEvolutionPointDto; currency: Currency }) {
  const t = useMessages().portfolioEvolution
  const result = point.value - point.investedAmount
  const percentage = point.investedAmount === 0 ? 0 : (result / point.investedAmount) * 100

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-1.5">
      <span className="text-muted-foreground">{t.result}</span>
      <span className={`font-mono font-medium tabular-nums ${result >= 0 ? "text-success" : "text-destructive"}`}>
        {formatSignedMoney(result, currency)} ({formatSignedPercentage(percentage)})
      </span>
    </div>
  )
}

function EvolutionNotes({ evolution, range }: { evolution: PortfolioEvolutionDto; range: PortfolioEvolutionRange }) {
  const t = useMessages().portfolioEvolution
  const historyStart =
    range !== "All" && evolution.points[0]?.date === evolution.historyStartsOn ? evolution.historyStartsOn : null

  return (
    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
      <p>{t.dailyNote}</p>
      {historyStart && <p>{t.historyStart(evolution.currency, formatDate(historyStart))}</p>}
      {evolution.interval === "Week" && <p>{t.weekly}</p>}
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
  const t = useMessages().portfolioEvolution
  const chartConfig = {
    value: { label: t.value, color: "var(--chart-1)" },
    investedAmount: { label: t.invested, color: "var(--muted-foreground)" },
  } satisfies ChartConfig
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
        toastApiError(error, t.loadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, range, refreshKey, t])

  const points = evolution?.points ?? []
  const showsMonths = evolution?.interval === "Week" || points.length > daysShownByDay

  const renderContent = () => {
    if (currencies !== null && currencies.length === 0) {
      return <p className="text-sm text-muted-foreground">{t.noInvestments}</p>
    }

    if (loadFailed && !isLoading) {
      return <p className="text-sm text-muted-foreground">{t.failed}</p>
    }

    if (currencies === null || !evolution) {
      return <Skeleton className="h-[300px] w-full" />
    }

    if (points.length < 2) {
      return (
        <p className="text-sm text-muted-foreground">{t.startedToday(evolution.currency)}</p>
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
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
        {currency && currencies && currencies.length > 1 && (
          <CardAction>
            <Select value={currency} onValueChange={(selected) => setChosenCurrency(selected as Currency)}>
              <SelectTrigger className="w-[100px]" aria-label={t.currencyAria}>
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
            aria-label={t.rangeAria}
            className="mb-4"
          >
            {ranges.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                aria-label={t.ranges[option].description}
                title={t.ranges[option].description}
                className="flex-none px-3"
              >
                {t.ranges[option].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {renderContent()}
      </CardContent>
    </Card>
  )
}
