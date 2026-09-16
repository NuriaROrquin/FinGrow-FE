"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getIntegration,
  NOT_LINKED,
  requestLinkCode,
  toastApiError,
  unlinkIntegration,
  type Integration,
  type IntegrationProvider,
  type LinkCode,
} from "@/lib/api"

const LINK_POLL_INTERVAL_MS = 5_000

export function useLinkCodeIntegration(provider: IntegrationProvider, name: string) {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [linkCode, setLinkCode] = useState<LinkCode | null>(null)
  const [generating, setGenerating] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const secondsLeft = useCountdown(linkCode?.expiresAt)
  const expired = linkCode !== null && secondsLeft === 0
  const linked = integration?.linked ?? false

  useEffect(() => {
    const controller = new AbortController()

    getIntegration(provider, controller.signal)
      .then(setIntegration)
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, `No pudimos consultar el estado de ${name}.`)
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [provider, name])

  const awaitingLink = linkCode !== null && !expired
  const linkedAtBeforeCode = integration?.linkedAt ?? null

  useEffect(() => {
    if (!awaitingLink) return

    const controller = new AbortController()
    const interval = setInterval(async () => {
      try {
        const current = await getIntegration(provider, controller.signal)
        if (current.linked && current.linkedAt !== linkedAtBeforeCode) {
          setIntegration(current)
          setLinkCode(null)
          toast.success(`${name} vinculado`)
        }
      } catch {
        return
      }
    }, LINK_POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      controller.abort()
    }
  }, [awaitingLink, linkedAtBeforeCode, provider, name])

  const generateCode = async () => {
    setGenerating(true)
    try {
      setLinkCode(await requestLinkCode(provider))
    } catch (error) {
      toastApiError(error, "No pudimos generar el código. Intentá de nuevo.")
    } finally {
      setGenerating(false)
    }
  }

  const unlink = async () => {
    setUnlinking(true)
    try {
      await unlinkIntegration(provider)
      setIntegration(NOT_LINKED)
      setLinkCode(null)
      toast.success(`${name} desvinculado`)
    } catch (error) {
      toastApiError(error, `No pudimos desvincular ${name}. Intentá de nuevo.`)
    } finally {
      setUnlinking(false)
    }
  }

  const cancelCode = () => setLinkCode(null)

  return { integration, linked, linkCode, expired, secondsLeft, generating, unlinking, generateCode, unlink, cancelCode }
}

function useCountdown(expiresAt: string | undefined): number {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0)
      return
    }

    const deadline = new Date(expiresAt).getTime()
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return secondsLeft
}
