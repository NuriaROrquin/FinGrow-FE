"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DownloadIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { ExpenseBreakdownSection } from "@/components/reports/expense-breakdown-section"
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
						<ExpenseBreakdownSection dateFrom={dateFrom} dateTo={dateTo} currency={currency} />
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
