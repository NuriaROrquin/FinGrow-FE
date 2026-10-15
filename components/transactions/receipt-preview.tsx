"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ExternalLink, FileText } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { getReceiptFile } from "@/lib/api/receipts"
import { useMessages } from "@/lib/i18n"

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; url: string; isImage: boolean }
  | { status: "failed" }

export function ReceiptPreview({ receiptId }: { receiptId: string }) {
  const t = useMessages().pendingInbox
  const [state, setState] = useState<PreviewState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    let url: string | null = null

    getReceiptFile(receiptId, controller.signal)
      .then((blob) => {
        url = URL.createObjectURL(blob)
        setState({ status: "ready", url, isImage: blob.type.startsWith("image/") })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "failed" })
        }
      })

    return () => {
      controller.abort()
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [receiptId])

  if (state.status === "loading") {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-border/70">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  if (state.status === "failed") {
    return <p className="text-xs text-muted-foreground">{t.receiptUnavailable}</p>
  }

  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-md border border-border/70"
    >
      {state.isImage ? (
        <Image
          src={state.url}
          alt={t.receiptPreviewAlt}
          width={800}
          height={600}
          className="max-h-56 w-full bg-muted/30 object-contain"
        />
      ) : (
        <span className="flex items-center gap-2 p-3 text-sm">
          <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
          {t.viewReceipt}
        </span>
      )}
      {state.isImage && (
        <span className="flex items-center justify-center gap-1 border-t border-border/70 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
          <ExternalLink className="size-3" aria-hidden="true" />
          {t.viewReceipt}
        </span>
      )}
    </a>
  )
}
