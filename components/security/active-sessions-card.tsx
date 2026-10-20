"use client"

import { useCallback, useEffect, useState } from "react"
import { Monitor, Smartphone } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  closeOtherSessions,
  closeSession,
  isApiError,
  listSessions,
  toastApiError,
  type ActiveSessionDto,
} from "@/lib/api"
import { formatDateTime, formatRelativeTime } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"

const MOBILE_SYSTEMS = new Set(["iOS", "iPadOS", "Android"])

type PendingClose = { kind: "one"; session: ActiveSessionDto } | { kind: "others" }

// Sin ubicación a propósito (HU-73): el backend no la registra y no se inventa una ciudad.
function describeDevice(session: ActiveSessionDto, texts: Messages["settings"]["security"]): string {
  if (session.browser === null && session.operatingSystem === null) return texts.unknownBrowser
  if (session.operatingSystem === null) return session.browser!

  return texts.sessionDevice(session.browser ?? texts.unknownBrowser, session.operatingSystem)
}

/** Las sesiones abiertas del usuario, empleado o empresa, y el cierre de las que no son esta (HU-73). */
export function ActiveSessionsCard() {
  const t = useMessages()
  const texts = t.settings.security
  const [sessions, setSessions] = useState<ActiveSessionDto[] | null>(null)
  const [pending, setPending] = useState<PendingClose | null>(null)
  const [closing, setClosing] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setSessions(await listSessions(signal))
      } catch (error) {
        if (signal?.aborted) return
        toastApiError(error, texts.sessionsFailed)
        setSessions([])
      }
    },
    [texts],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const confirmClose = async () => {
    if (pending === null) return
    setClosing(true)

    try {
      if (pending.kind === "one") {
        await closeSession(pending.session.id)
        toast.success(texts.sessionClosed)
      } else {
        await closeOtherSessions()
        toast.success(texts.otherSessionsClosed)
      }
    } catch (error) {
      // 404: la sesión ya venció o se cerró desde otro lado; recargar la lista alcanza.
      if (!isApiError(error) || error.status !== 404) {
        toastApiError(error, texts.closeSessionFailed)
      }
    } finally {
      setClosing(false)
      setPending(null)
      await load()
    }
  }

  const hasOthers = sessions?.some((session) => !session.isCurrent) ?? false

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{texts.activeSessions}</h3>
          <p className="text-sm text-muted-foreground">{texts.activeSessionsDescription}</p>
        </div>
        {hasOthers && (
          <Button variant="outline" size="sm" onClick={() => setPending({ kind: "others" })}>
            {texts.closeOtherSessions}
          </Button>
        )}
      </div>

      {sessions === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> {texts.loadingSessions}
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => {
            const Icon = session.operatingSystem && MOBILE_SYSTEMS.has(session.operatingSystem) ? Smartphone : Monitor

            return (
              <li key={session.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {describeDevice(session, texts)}
                      {session.isCurrent && <Badge variant="secondary">{texts.currentSession}</Badge>}
                    </p>
                    <p className="text-sm text-muted-foreground">{texts.sessionStarted(formatDateTime(session.startedAt))}</p>
                    <p className="text-sm text-muted-foreground">
                      {texts.sessionLastActive(formatRelativeTime(session.lastActiveAt))}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button variant="outline" size="sm" onClick={() => setPending({ kind: "one", session })}>
                    {texts.closeSession}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && !closing && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "others" ? texts.closeOtherSessionsTitle : texts.closeSessionTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "one"
                ? texts.closeSessionDescription(describeDevice(pending.session, texts))
                : texts.closeOtherSessionsDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={closing}
              onClick={(event) => {
                event.preventDefault()
                void confirmClose()
              }}
            >
              {closing
                ? texts.closing
                : pending?.kind === "others"
                  ? texts.closeOtherSessions
                  : texts.closeSession}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
