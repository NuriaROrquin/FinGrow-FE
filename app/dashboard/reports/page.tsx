"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DownloadIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { ExpenseBreakdownSection } from "@/components/reports/expense-breakdown-section"
import { FinancialInsightsSection } from "@/components/reports/financial-insights-section"
import { MonthlyEvolutionChart } from "@/components/reports/monthly-evolution-chart"
import { MonthlyHighlightsCard } from "@/components/reports/monthly-highlights-card"
import { ReportPdfExport } from "@/components/reports/report-pdf-export"
import { ReportSummaryCards } from "@/components/reports/report-summary-cards"
import { SavingsVsGoalsReport } from "@/components/reports/savings-vs-goals-report"
import { useReportRequest } from "@/components/reports/use-report-request"
import { PeriodFilter, getInclusiveMonthCount, getLastMonthsStart, getToday } from "@/components/period-filter"
import { getExpenseBreakdown, getFinancialInsights, getMonthlySummary, getSavingsVsGoals } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"

// HU-41: la vista por defecto son los últimos seis meses, contando el mes en curso.
const DEFAULT_MONTHS = 6

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

export default function ReportsPage() {
	const t = useMessages()
	const { preferences } = usePreferences()
	const [currency, setCurrency] = useState<Currency>(preferences.currency)
	const [savingsCurrency, setSavingsCurrency] = useState<Currency>(preferences.currency)
	const [dateFrom, setDateFrom] = useState(() => getLastMonthsStart(DEFAULT_MONTHS))
	const [dateTo, setDateTo] = useState(() => getToday())
	const [isComparingExpenses, setIsComparingExpenses] = useState(false)
	const [exportedAt, setExportedAt] = useState<Date | null>(null)
	const savingsMonths = getInclusiveMonthCount(dateFrom, dateTo)

	const loadSummary = useCallback(
		(signal: AbortSignal) => getMonthlySummary(currency, dateFrom, dateTo, signal),
		[currency, dateFrom, dateTo],
	)
	const loadBreakdown = useCallback(
		(signal: AbortSignal) => getExpenseBreakdown(currency, dateFrom, dateTo, signal),
		[currency, dateFrom, dateTo],
	)
	const loadInsights = useCallback(
		(signal: AbortSignal) => getFinancialInsights(currency, dateFrom, dateTo, signal),
		[currency, dateFrom, dateTo],
	)
	const loadSavings = useCallback(
		(signal: AbortSignal) => getSavingsVsGoals(savingsCurrency, savingsMonths, signal),
		[savingsCurrency, savingsMonths],
	)

	const summary = useReportRequest(loadSummary, "No se pudo cargar el resumen mensual.")
	const breakdown = useReportRequest(loadBreakdown, t.expenseBreakdown.loadFailed)
	const insights = useReportRequest(loadInsights, "No se pudieron cargar los hitos y recomendaciones.")
	const savings = useReportRequest(loadSavings, "No se pudo cargar el reporte de ahorros.")

	const isReportLoading = summary.isLoading || breakdown.isLoading || insights.isLoading || savings.isLoading
	const isExporting = exportedAt !== null

	const finishExport = useCallback(() => setExportedAt(null), [])
	const failExport = useCallback(() => {
		setExportedAt(null)
		toast.error(t.reportPdf.exportFailed)
	}, [t.reportPdf.exportFailed])

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between flex-col lg:flex-row gap-4">
				<div>
					<h1 className="text-3xl font-bold text-balance">Reportes Financieros</h1>
					<p className="text-muted-foreground mt-1">Análisis completo de tus datos financieros</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
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
					<Button onClick={() => setExportedAt(new Date())} disabled={isReportLoading || isExporting}>
						<DownloadIcon className="size-4" />
						{isExporting ? t.reportPdf.exporting : t.reportPdf.export}
					</Button>
				</div>
			</div>

			<div>
				<ReportSummaryCards summary={summary.data} isLoading={summary.isLoading} />

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
							<div className="min-w-0 lg:col-span-2">
								<MonthlyEvolutionChart summary={summary.data} isLoading={summary.isLoading} />
							</div>
							<MonthlyHighlightsCard summary={summary.data} isLoading={summary.isLoading} />
						</div>

						<FinancialInsightsSection insights={insights.data} isLoading={insights.isLoading} />
					</TabsContent>

					{/* Spending Analysis Tab */}
					<TabsContent value="spending" className="space-y-4">
						<ExpenseBreakdownSection
							breakdown={breakdown.data}
							isLoading={breakdown.isLoading}
							isComparing={isComparingExpenses}
							onComparingChange={setIsComparingExpenses}
						/>
					</TabsContent>

					{/* Savings Report Tab */}
					<TabsContent value="savings" className="space-y-4">
						<SavingsVsGoalsReport
							report={savings.data}
							isLoading={savings.isLoading}
							currency={savingsCurrency}
							onCurrencyChange={setSavingsCurrency}
							dateFrom={dateFrom}
							dateTo={dateTo}
						/>
					</TabsContent>
				</Tabs>
			</div>

			{exportedAt && (
				<ReportPdfExport
					generatedAt={exportedAt}
					dateFrom={dateFrom}
					dateTo={dateTo}
					currency={currency}
					savingsCurrency={savingsCurrency}
					summary={summary.data}
					breakdown={breakdown.data}
					insights={insights.data}
					savings={savings.data}
					isComparingExpenses={isComparingExpenses}
					onComplete={finishExport}
					onError={failExport}
				/>
			)}
		</div>
	)
}
