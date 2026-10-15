"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { DownloadIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { FinancialInsightsSection } from "@/components/reports/financial-insights-section"
import { MonthlyEvolutionChart } from "@/components/reports/monthly-evolution-chart"
import { MonthlyHighlightsCard } from "@/components/reports/monthly-highlights-card"
import { ReportSummaryCards } from "@/components/reports/report-summary-cards"
import { SavingsVsGoalsReport } from "@/components/reports/savings-vs-goals-report"
import { PeriodFilter, getInclusiveMonthCount, getLastMonthsStart, getToday } from "@/components/period-filter"
import { getMonthlySummary, toastApiError, type MonthlySummaryDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { usePreferences } from "@/lib/preferences-context"

// HU-41: la vista por defecto son los últimos seis meses, contando el mes en curso.
const DEFAULT_MONTHS = 6

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

const categoryBreakdown = [
	{ category: "Comida", amount: 120000, percentage: 24 },
	{ category: "Servicios", amount: 140000, percentage: 28 },
	{ category: "Transporte", amount: 80000, percentage: 16 },
	{ category: "Entretenimiento", amount: 60000, percentage: 12 },
	{ category: "Compras", amount: 50000, percentage: 10 },
	{ category: "Otros", amount: 50000, percentage: 10 },
]

const chartConfig = {
	amount: {
		label: "Monto",
		color: "hsl(var(--chart-1))",
	},
}

export default function ReportsPage() {
	const { preferences } = usePreferences()
	const [currency, setCurrency] = useState<Currency>(preferences.currency)
	const [isExporting, setIsExporting] = useState(false)
	const [dateFrom, setDateFrom] = useState(() => getLastMonthsStart(DEFAULT_MONTHS))
	const [dateTo, setDateTo] = useState(() => getToday())
	const [summary, setSummary] = useState<MonthlySummaryDto | null>(null)
	const [isSummaryLoading, setIsSummaryLoading] = useState(true)

	useEffect(() => {
		const controller = new AbortController()
		setIsSummaryLoading(true)

		getMonthlySummary(currency, dateFrom, dateTo, controller.signal)
			.then(setSummary)
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") return
				setSummary(null)
				toastApiError(error, "No se pudo cargar el resumen mensual.")
			})
			.finally(() => {
				if (!controller.signal.aborted) setIsSummaryLoading(false)
			})

		return () => controller.abort()
	}, [currency, dateFrom, dateTo])

	const handleExportPDF = () => {
		setIsExporting(true)

		// Crear estilos específicos para la impresión
		const printStyles = document.createElement("style")
		printStyles.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #report-content, #report-content * {
          visibility: visible;
        }
        #report-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 1cm;
        }
      }
    `
		document.head.appendChild(printStyles)

		// Pequeño delay para asegurar que los estilos se apliquen
		setTimeout(() => {
			window.print()
			document.head.removeChild(printStyles)
			setIsExporting(false)
		}, 250)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between flex-col lg:flex-row gap-4">
				<div>
					<h1 className="text-3xl font-bold text-balance">Reportes Financieros</h1>
					<p className="text-muted-foreground mt-1">Análisis completo de tus datos financieros</p>
				</div>
				<div className="flex items-center gap-2 no-print">
					<PeriodFilter
						dateFrom={dateFrom}
						dateTo={dateTo}
						onChange={({ dateFrom: nextDateFrom, dateTo: nextDateTo }) => {
							setDateFrom(nextDateFrom)
							setDateTo(nextDateTo)
						}}
					/>
					<Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
						<SelectTrigger className="w-[100px]" aria-label="Moneda del reporte">
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
					<Button onClick={handleExportPDF} disabled={isExporting}>
						<DownloadIcon className="size-4" />
						{isExporting ? "Preparando..." : "Exportar PDF"}
					</Button>
				</div>
			</div>

			{/* Contenedor para exportar */}
			<div id="report-content">
				<ReportSummaryCards summary={summary} isLoading={isSummaryLoading} />

				{/* Report Tabs */}
				<Tabs defaultValue="overview" className="space-y-4 mt-8">
					<TabsList>
						<TabsTrigger value="overview">Resumen</TabsTrigger>
						<TabsTrigger value="spending">Análisis de Gastos</TabsTrigger>
						<TabsTrigger value="savings">Reporte de Ahorros</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<MonthlyEvolutionChart summary={summary} isLoading={isSummaryLoading} />
							</div>
							<MonthlyHighlightsCard summary={summary} isLoading={isSummaryLoading} />
						</div>

						<FinancialInsightsSection dateFrom={dateFrom} dateTo={dateTo} currency={currency} />
					</TabsContent>

					{/* Spending Analysis Tab */}
					<TabsContent value="spending" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Gastos por Categoría</CardTitle>
								<CardDescription>Dónde va tu dinero cada mes</CardDescription>
							</CardHeader>
							<CardContent>
								<ChartContainer config={chartConfig} className="h-[350px] w-full">
									<BarChart
										data={categoryBreakdown}
										layout="vertical"
										margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#e5e7eb"
											opacity={0.5}
										/>
										<XAxis
											type="number"
											tick={{ fill: "#6b7280", fontSize: 12 }}
											axisLine={{ stroke: "#e5e7eb" }}
										/>
										<YAxis
											dataKey="category"
											type="category"
											width={100}
											tick={{ fill: "#6b7280", fontSize: 12 }}
											axisLine={{ stroke: "#e5e7eb" }}
										/>
										<ChartTooltip
											content={<ChartTooltipContent />}
											cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
										/>
										<Bar
											dataKey="amount"
											fill="#8b5cf6"
											radius={[0, 8, 8, 0]}
											animationDuration={800}
											animationBegin={0}
										/>
									</BarChart>
								</ChartContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Detalles por Categoría</CardTitle>
								<CardDescription>Desglose detallado de categorías de gasto</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{categoryBreakdown.map((category) => (
										<div
											key={category.category}
											className="flex items-center justify-between p-3 rounded-lg border"
										>
											<div className="flex-1">
												<div className="flex items-center justify-between mb-2">
													<span className="font-medium">{category.category}</span>
													<div className="flex items-center gap-2">
														<Badge variant="outline">{category.percentage}%</Badge>
														<span className="font-semibold">
															${category.amount.toLocaleString()}
														</span>
													</div>
												</div>
												<div className="h-2 bg-muted rounded-full overflow-hidden">
													<div
														className="h-full bg-primary transition-all"
														style={{ width: `${category.percentage * 2.5}%` }}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Savings Report Tab */}
					<TabsContent value="savings" className="space-y-4">
						<SavingsVsGoalsReport months={getInclusiveMonthCount(dateFrom, dateTo)} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
