import { toast } from "sonner"

import { ApiError, isApiError } from "./errors"
import { currentMessages } from "@/lib/i18n/messages"

/**
 * Muestra un error de la API como toast.
 *
 * El texto grande es `description`, que ya viene escrito para una persona. El
 * `code` va abajo y en chico: no significa nada para quien usa la app, pero es lo
 * primero que se pide cuando alguien reporta un problema.
 */
export interface ToastApiErrorOptions {
  showCode?: boolean
}

export function toastApiError(
  error: unknown,
  fallbackMessage = currentMessages().apiErrors.unexpected,
  { showCode = true }: ToastApiErrorOptions = {},
): void {
  if (!isApiError(error)) {
    toast.error(fallbackMessage)
    return
  }

  toast.error(error.description, {
    description: buildDetail(error, showCode),
  })
}

function buildDetail(error: ApiError, showCode: boolean): string | undefined {
  const texts = currentMessages().apiErrors
  const parts: string[] = []

  if (error.fieldErrors) {
    parts.push(...Object.values(error.fieldErrors).flat())
  }

  if (parts.length === 0 && showCode) {
    parts.push(texts.code(error.code))
  }

  if (error.traceId) {
    parts.push(texts.reference(error.traceId))
  }

  return parts.length > 0 ? parts.join(" · ") : undefined
}
