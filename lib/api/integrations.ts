import { api } from "./client"

export type IntegrationProvider = "whatsapp" | "telegram" | "mercadopago" | "gmail" | "iol"

export type IntegrationStatus = "Active" | "Error"

export interface LinkCode {
  code: string
  expiresAt: string
}

export interface Integration {
  linked: boolean
  externalAccountId: string | null
  linkedAt: string | null
  /** Solo viene cuando la integracion existe. En Error hay que volver a vincular. */
  status?: IntegrationStatus | null
  errorReason?: string | null
}

export const NOT_LINKED: Integration = { linked: false, externalAccountId: null, linkedAt: null, status: null }

export function getIntegration(provider: IntegrationProvider, signal?: AbortSignal): Promise<Integration> {
  return api.get<Integration>(`/api/integrations/${provider}`, { signal })
}

export function requestLinkCode(provider: IntegrationProvider, signal?: AbortSignal): Promise<LinkCode> {
  return api.post<LinkCode>(`/api/integrations/${provider}/link-code`, undefined, { signal })
}

export function unlinkIntegration(provider: IntegrationProvider, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/integrations/${provider}`, { signal })
}

export interface MercadoPagoAuthorization {
  authorizationUrl: string
  expiresAt: string
}

export interface MercadoPagoSyncSummary {
  imported: number
  alreadyKnown: number
  ignored: number
  syncedAt: string
}

export type MercadoPagoLinkResult = "linked" | "error"

export function startMercadoPagoLink(signal?: AbortSignal): Promise<MercadoPagoAuthorization> {
  return api.post<MercadoPagoAuthorization>("/api/integrations/mercadopago/oauth/start", undefined, { signal })
}

export function syncMercadoPago(signal?: AbortSignal): Promise<MercadoPagoSyncSummary> {
  return api.post<MercadoPagoSyncSummary>("/api/integrations/mercadopago/sync", undefined, { signal })
}

export interface GmailAuthorization {
  authorizationUrl: string
  expiresAt: string
}

export type GmailLinkResult = "linked" | "error"

export function startGmailLink(signal?: AbortSignal): Promise<GmailAuthorization> {
  return api.post<GmailAuthorization>("/api/integrations/gmail/oauth/start", undefined, { signal })
}

export interface GmailSyncSummary {
  imported: number
  alreadyKnown: number
  notBills: number
  remaining: number
  syncedAt: string
}

export function syncGmail(signal?: AbortSignal): Promise<GmailSyncSummary> {
  return api.post<GmailSyncSummary>("/api/integrations/gmail/sync", undefined, { signal })
}

export interface IolSyncSummary {
  imported: number
  updated: number
  unchanged: number
  ignored: number
  noLongerHeld: number
  syncedAt: string
}

/** El backend responde 409 con este codigo cuando la autorizacion de IOL vencio y hay que volver a vincular. */
export const IOL_GRANT_EXPIRED = "Integrations.Iol.GrantExpired"

export function linkIol(username: string, password: string, signal?: AbortSignal): Promise<Integration> {
  return api.post<Integration>("/api/integrations/iol/link", { username, password }, { signal })
}

export function syncIol(signal?: AbortSignal): Promise<IolSyncSummary> {
  return api.post<IolSyncSummary>("/api/integrations/iol/sync", undefined, { signal })
}
