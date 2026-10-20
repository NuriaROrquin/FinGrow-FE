"use client"

import { createContext, useContext } from "react"

const ReportExportContext = createContext(false)

export const ReportExportProvider = ReportExportContext.Provider

export function useIsReportExport(): boolean {
  return useContext(ReportExportContext)
}
