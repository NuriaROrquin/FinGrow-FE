export const GMAIL_RESULT_PARAM = "gmail"
export const MERCADO_PAGO_RESULT_PARAM = "mercadopago"

export function tabAfterLink(searchParams: Pick<URLSearchParams, "has">) {
  return searchParams.has(GMAIL_RESULT_PARAM) || searchParams.has(MERCADO_PAGO_RESULT_PARAM) ? "integrations" : null
}
