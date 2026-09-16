import { api } from "./client"

export interface WhatsAppLinkCode {
  code: string
  expiresAt: string
}

export interface WhatsAppIntegration {
  linked: boolean
  phoneNumber: string | null
  linkedAt: string | null
}

export function getWhatsAppIntegration(signal?: AbortSignal): Promise<WhatsAppIntegration> {
  return api.get<WhatsAppIntegration>("/api/integrations/whatsapp", { signal })
}

export function unlinkWhatsApp(signal?: AbortSignal): Promise<void> {
  return api.delete("/api/integrations/whatsapp", { signal })
}

export function requestWhatsAppLinkCode(signal?: AbortSignal): Promise<WhatsAppLinkCode> {
  return api.post<WhatsAppLinkCode>("/api/integrations/whatsapp/link-code", undefined, { signal })
}
