"use client"

/**
 * Año en curso, calculado en el navegador: la página de inicio se genera estática al buildear y
 * un año calculado en el servidor quedaría fijo hasta el próximo deploy.
 */
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>
}
