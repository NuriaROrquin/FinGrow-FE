"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { DownloadIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { SavingsVsGoalsReport } from "@/components/reports/savings-vs-goals-report"
import { PeriodFilter, getCurrentMonthStart, getInclusiveMonthCount, getToday } from "@/components/period-filter"

const monthlyIncomeExpense = [
	{ month: "Ene", income: 500000, expense: 240000, savings: 260000 },
	{ month: "Feb", income: 500000, expense: 139800, savings: 360200 },
	{ month: "Mar", income: 520000, expense: 380000, savings: 140000 },
	{ month: "Abr", income: 520000, expense: 390800, savings: 129200 },
	{ month: "May", income: 550000, expense: 480000, savings: 70000 },
	{ month: "Jun", income: 550000, expense: 380000, savings: 170000 },
]

const categoryBreakdown = [
	{ category: "Comida", amount: 120000, percentage: 24 },
	{ category: "Servicios", amount: 140000, percentage: 28 },
	{ category: "Transporte", amount: 80000, percentage: 16 },
	{ category: "Entretenimiento", amount: 60000, percentage: 12 },
	{ category: "Compras", amount: 50000, percentage: 10 },
	{ category: "Otros", amount: 50000, percentage: 10 },
]

const chartConfig = {
	income: {
		label: "Ingresos",
		color: "hsl(var(--chart-2))",
	},
	expense: {
		label: "Gastos",
		color: "hsl(var(--chart-1))",
	},
	savings: {
		label: "Ahorros",
		color: "hsl(var(--chart-3))",
	},
	amount: {
		label: "Monto",
		color: "hsl(var(--chart-1))",
	},
}

export default function ReportsPage() {
	const totalIncome = monthlyIncomeExpense.reduce((sum, m) => sum + m.income, 0)
	const totalExpense = monthlyIncomeExpense.reduce((sum, m) => sum + m.expense, 0)
	const totalSavings = monthlyIncomeExpense.reduce((sum, m) => sum + m.savings, 0)
	const avgMonthlySavings = totalSavings / monthlyIncomeExpense.length

	const [isExporting, setIsExporting] = useState(false)
	const [dateFrom, setDateFrom] = useState(() => getCurrentMonthStart())
	const [dateTo, setDateTo] = useState(() => getToday())

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
					<Button onClick={handleExportPDF} disabled={isExporting}>
						<DownloadIcon className="size-4" />
						{isExporting ? "Preparando..." : "Exportar PDF"}
					</Button>
				</div>
			</div>

			{/* Contenedor para exportar */}
			<div id="report-content">
				{/* Summary Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Ingresos Totales</CardDescription>
							<CardTitle className="text-2xl text-success">
								${totalIncome.toLocaleString()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Últimos 6 meses</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Gastos Totales</CardDescription>
							<CardTitle className="text-2xl">
								${totalExpense.toLocaleString()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Últimos 6 meses</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Ahorros Totales</CardDescription>
							<CardTitle className="text-2xl text-success">
								${totalSavings.toLocaleString()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Últimos 6 meses</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Ahorro Mensual Promedio</CardDescription>
							<CardTitle className="text-2xl">
								${avgMonthlySavings.toLocaleString()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Por mes</p>
						</CardContent>
					</Card>
				</div>

				{/* Report Tabs */}
				<Tabs defaultValue="overview" className="space-y-4 mt-8">
					<TabsList>
						<TabsTrigger value="overview">Resumen</TabsTrigger>
						<TabsTrigger value="spending">Análisis de Gastos</TabsTrigger>
						<TabsTrigger value="savings">Reporte de Ahorros</TabsTrigger>
					</TabsList>

					{/* Overview Tab */}
					<TabsContent value="overview" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Ingresos vs Gastos</CardTitle>
								<CardDescription>Comparación mensual de ingresos y gastos</CardDescription>
							</CardHeader>
							<CardContent>
								<ChartContainer config={chartConfig} className="h-[400px] w-full">
									<BarChart
										data={monthlyIncomeExpense}
										margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#e5e7eb"
											opacity={0.5}
										/>
										<XAxis
											dataKey="month"
											tick={{ fill: "#6b7280", fontSize: 12 }}
											axisLine={{ stroke: "#e5e7eb" }}
										/>
										<YAxis
											tick={{ fill: "#6b7280", fontSize: 12 }}
											axisLine={{ stroke: "#e5e7eb" }}
										/>
										<ChartTooltip
											content={<ChartTooltipContent />}
											cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
										/>
										<Bar
											dataKey="income"
											fill="#a78bfa"
											radius={[8, 8, 0, 0]}
											animationDuration={800}
											animationBegin={0}
										/>
										<Bar
											dataKey="expense"
											fill="#8b5cf6"
											radius={[8, 8, 0, 0]}
											animationDuration={800}
											animationBegin={100}
										/>
									</BarChart>
								</ChartContainer>
							</CardContent>
						</Card>

						<div className="grid gap-4 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle>Resumen Financiero</CardTitle>
									<CardDescription>Métricas clave del período</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
											<div className="flex items-center gap-3">
												<TrendingUpIcon className="size-5 text-success" />
												<div>
													<p className="font-medium">Mes con Mayor Ingreso</p>
													<p className="text-sm text-muted-foreground">
														Mayo y Junio
													</p>
												</div>
											</div>
											<span className="font-semibold text-success">$5,500</span>
										</div>

										<div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
											<div className="flex items-center gap-3">
												<TrendingDownIcon className="size-5 text-destructive" />
												<div>
													<p className="font-medium">Mes con Mayor Gasto</p>
													<p className="text-sm text-muted-foreground">Mayo</p>
												</div>
											</div>
											<span className="font-semibold text-destructive">$4,800</span>
										</div>

										<div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
											<div className="flex items-center gap-3">
												<DollarSignIcon className="size-5 text-primary" />
												<div>
													<p className="font-medium">Mejor Mes de Ahorro</p>
													<p className="text-sm text-muted-foreground">Febrero</p>
												</div>
											</div>
											<span className="font-semibold text-primary">$3,602</span>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Análisis y Recomendaciones</CardTitle>
									<CardDescription>Basado en tus datos financieros</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
											<p className="text-sm font-medium text-blue-900 dark:text-blue-100">
												Tu tasa de ahorro es del 32% - por encima del 20% recomendado
											</p>
										</div>

										<div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
											<p className="text-sm font-medium text-amber-900 dark:text-amber-100">
												Mayo tuvo gastos inusualmente altos. Revisa los gastos discrecionales.
											</p>
										</div>

										<div className="p-3 rounded-lg bg-success/10 border border-success/20">
											<p className="text-sm font-medium">
												Se detectó crecimiento constante de ingresos. Considera aumentar
												contribuciones de jubilación.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
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
