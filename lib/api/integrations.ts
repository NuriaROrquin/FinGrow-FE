import { api } from "./client"

export interface WhatsAppLinkCode {
  code: string
  expiresAt: string
}

export function requestWhatsAppLinkCode(signal?: AbortSignal): Promise<WhatsAppLinkCode> {
  return api.post<WhatsAppLinkCode>("/api/integrations/whatsapp/link-code", undefined, { signal })
}
