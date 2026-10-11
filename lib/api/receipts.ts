import { api } from "./client"

export const receiptAcceptedTypes = ["image/jpeg", "image/png", "application/pdf"] as const

export const receiptMaxSizeBytes = 10 * 1024 * 1024

export interface TransactionReceiptDto {
  id: string
  transactionId: string | null
  contentType: string
  sizeBytes: number
  fileName: string | null
  uploadedAt: string
}

export function uploadReceipt(file: File, signal?: AbortSignal): Promise<TransactionReceiptDto> {
  const form = new FormData()
  form.append("file", file)

  return api.post<TransactionReceiptDto>("/api/receipts", form, { signal })
}

export function getReceiptFile(id: string, signal?: AbortSignal): Promise<Blob> {
  return api.get<Blob>(`/api/receipts/${encodeURIComponent(id)}/file`, {
    headers: { Accept: "*/*" },
    responseType: "blob",
    signal,
  })
}
