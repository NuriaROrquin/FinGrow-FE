import { toast } from "sonner"

import { ApiError, isApiError } from "./errors"

/**
 * Muestra un error de la API como toast.
 *
 * El texto grande es `description`, que ya viene escrito para una persona. El
 * `code` va abajo y en chico: no significa nada para quien usa la app, pero es lo
 * primero que se pide cuando alguien reporta un problema.
 */
export function toastApiError(error: unknown, fallbackMessage = "Ocurrió un error inesperado."): void {
  if (!isApiError(error)) {
    toast.error(fallbackMessage)
    return
  }

  toast.error(error.description, {
    description: buildDetail(error),
  })
}

function buildDetail(error: ApiError): string | undefined {
  const parts: string[] = []

  if (error.fieldErrors) {
    parts.push(...Object.values(error.fieldErrors).flat())
  }

  if (parts.length === 0) {
    parts.push(`Código: ${error.code}`)
  }

  if (error.traceId) {
    parts.push(`Referencia: ${error.traceId}`)
  }

  return parts.join(" · ")
}
