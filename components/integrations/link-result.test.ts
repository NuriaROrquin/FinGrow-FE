import { describe, expect, it } from "vitest"

import { tabAfterLink } from "./link-result"

describe("tabAfterLink", () => {
  it.each([
    "mercadopago=linked",
    "mercadopago=error&reason=Integrations.MercadoPago.StateInvalido",
    "gmail=linked",
    "gmail=error&reason=Integrations.Gmail.Denegado",
    "tab=security&mercadopago=linked",
  ])("opens the integrations tab when coming back from a link (%s)", (query) => {
    expect(tabAfterLink(new URLSearchParams(query))).toBe("integrations")
  })

  it.each(["", "tab=security", "telegram=linked"])("does not choose a tab otherwise (%s)", (query) => {
    expect(tabAfterLink(new URLSearchParams(query))).toBeNull()
  })
})
