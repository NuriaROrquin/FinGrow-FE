import type { jsPDF } from "jspdf"

const PAGE_MARGIN_MM = 12
const FOOTER_HEIGHT_MM = 6
const BLOCK_GAP_MM = 5
const CAPTURE_SCALE = 2
const CAPTURE_WINDOW_WIDTH = 1440
const JPEG_QUALITY = 0.92
const RENDER_TIMEOUT_MS = 5000
const RENDER_POLL_MS = 50
const SVG_FALLBACK_FONTS = "ui-sans-serif, system-ui, sans-serif"

interface Capture {
  canvas: HTMLCanvasElement
  cardBreaks: number[]
  lineBreaks: number[]
}

interface Breaks {
  cardBreaks: number[]
  lineBreaks: number[]
}

export async function exportReportPdf(root: HTMLElement, fileName: string, signal: AbortSignal): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")])
  await waitUntilRendered(root, signal)

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true })
  const layout = new PageLayout(pdf)

  for (const block of Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"))) {
    let breaks: Breaks = { cardBreaks: [], lineBreaks: [] }
    const canvas = await html2canvas(block, {
      scale: CAPTURE_SCALE,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: CAPTURE_WINDOW_WIDTH,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDocument, clonedBlock) => {
        prepareClone(clonedDocument, clonedBlock)
        breaks = findBreaks(clonedBlock)
      },
    })
    signal.throwIfAborted()

    layout.place({
      canvas,
      cardBreaks: breaks.cardBreaks.map((fraction) => Math.round(fraction * canvas.height)),
      lineBreaks: breaks.lineBreaks.map((fraction) => Math.round(fraction * canvas.height)),
    })
  }

  layout.numberPages()
  signal.throwIfAborted()
  pdf.save(fileName)
}

async function waitUntilRendered(root: HTMLElement, signal: AbortSignal): Promise<void> {
  await document.fonts.ready
  await Promise.all(Array.from(root.querySelectorAll("img")).map((image) => image.decode().catch(() => undefined)))

  const deadline = Date.now() + RENDER_TIMEOUT_MS
  while (!isReady(root) && Date.now() < deadline) {
    signal.throwIfAborted()
    await wait(RENDER_POLL_MS)
  }

  await wait(RENDER_POLL_MS)
  signal.throwIfAborted()
}

// Una tarjeta que todavía muestra su esqueleto está esperando datos: capturarla dejaría el PDF a medias.
function isReady(root: HTMLElement): boolean {
  return areChartsRendered(root) && root.querySelector('[data-slot="skeleton"]') === null
}

function areChartsRendered(root: HTMLElement): boolean {
  return Array.from(root.querySelectorAll('[data-slot="chart"]')).every(
    (chart) => chart.querySelector("svg.recharts-surface") !== null,
  )
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function prepareClone(clonedDocument: Document, clonedBlock: HTMLElement): void {
  const html = clonedDocument.documentElement
  html.classList.remove("dark")
  html.classList.add("light")
  html.style.colorScheme = "light"

  const root = clonedBlock.closest<HTMLElement>("[data-pdf-root]")
  if (root) root.style.left = "0px"

  const view = clonedDocument.defaultView
  if (!view) return

  for (const text of Array.from(clonedBlock.querySelectorAll<SVGTextElement>("svg text"))) {
    text.style.fontFamily = `${view.getComputedStyle(text).fontFamily}, ${SVG_FALLBACK_FONTS}`
  }
}

function findBreaks(block: HTMLElement): Breaks {
  const { top, height } = block.getBoundingClientRect()
  if (height === 0) return { cardBreaks: [], lineBreaks: [] }

  const elements = Array.from(block.querySelectorAll("*"))
  const cards = elements.filter((element) => element.matches('[data-slot="card"]')).map(toRange)
  const leaves = elements
    .filter((element) => element.localName === "svg" || (element.closest("svg") === null && element.childElementCount === 0))
    .map(toRange)
    .filter((range) => range.bottom > range.top)

  const toFractions = (offsets: number[]) =>
    [...new Set(offsets)]
      .filter((offset) => offset > 0 && offset < height)
      .sort((first, second) => first - second)
      .map((offset) => offset / height)

  return {
    cardBreaks: toFractions(cards.map((card) => card.bottom).filter((offset) => !crossesAny(offset, cards))),
    lineBreaks: toFractions(leaves.map((leaf) => leaf.bottom).filter((offset) => !crossesAny(offset, leaves))),
  }

  function toRange(element: Element): { top: number; bottom: number } {
    const rect = element.getBoundingClientRect()
    return { top: Math.round(rect.top - top), bottom: Math.round(rect.bottom - top) }
  }
}

function crossesAny(offset: number, ranges: { top: number; bottom: number }[]): boolean {
  return ranges.some((range) => range.top < offset && range.bottom > offset)
}

function lastBreakWithin(breaks: number[], start: number, end: number): number | undefined {
  return breaks.filter((offset) => offset > start && offset <= end).at(-1)
}

class PageLayout {
  private readonly pageWidth: number
  private readonly pageHeight: number
  private readonly contentWidth: number
  private readonly contentBottom: number
  private cursor = PAGE_MARGIN_MM

  constructor(private readonly pdf: jsPDF) {
    this.pageWidth = pdf.internal.pageSize.getWidth()
    this.pageHeight = pdf.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - PAGE_MARGIN_MM * 2
    this.contentBottom = this.pageHeight - PAGE_MARGIN_MM - FOOTER_HEIGHT_MM
  }

  place({ canvas, cardBreaks, lineBreaks }: Capture): void {
    const pixelsPerMm = canvas.width / this.contentWidth
    const pageCapacity = (this.contentBottom - PAGE_MARGIN_MM) * pixelsPerMm
    let start = 0

    while (start < canvas.height) {
      const available = Math.floor((this.contentBottom - this.cursor) * pixelsPerMm)
      const remaining = canvas.height - start

      if (remaining <= available) {
        this.draw(canvas, start, canvas.height, pixelsPerMm)
        break
      }

      if (!this.isPageEmpty() && remaining <= pageCapacity) {
        this.addPage()
        continue
      }

      const end =
        lastBreakWithin(cardBreaks, start, start + available) ??
        (this.isPageEmpty() ? (lastBreakWithin(lineBreaks, start, start + available) ?? start + available) : undefined)

      if (end === undefined) {
        this.addPage()
        continue
      }

      this.draw(canvas, start, end, pixelsPerMm)
      start = end
      this.addPage()
    }

    this.cursor += BLOCK_GAP_MM
  }

  numberPages(): void {
    const total = this.pdf.getNumberOfPages()
    const baseline = this.pageHeight - PAGE_MARGIN_MM / 2

    for (let page = 1; page <= total; page++) {
      this.pdf.setPage(page)
      this.pdf.setFont("helvetica", "normal")
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(130)
      this.pdf.text("FinGrow", PAGE_MARGIN_MM, baseline)
      this.pdf.text(`${page} / ${total}`, this.pageWidth - PAGE_MARGIN_MM, baseline, { align: "right" })
    }
  }

  private isPageEmpty(): boolean {
    return this.cursor === PAGE_MARGIN_MM
  }

  private addPage(): void {
    this.pdf.addPage()
    this.cursor = PAGE_MARGIN_MM
  }

  private draw(canvas: HTMLCanvasElement, start: number, end: number, pixelsPerMm: number): void {
    const image = start === 0 && end === canvas.height ? canvas : crop(canvas, start, end)
    const height = (end - start) / pixelsPerMm

    this.pdf.addImage(image.toDataURL("image/jpeg", JPEG_QUALITY), "JPEG", PAGE_MARGIN_MM, this.cursor, this.contentWidth, height)
    this.cursor += height
  }
}

function crop(canvas: HTMLCanvasElement, start: number, end: number): HTMLCanvasElement {
  const slice = document.createElement("canvas")
  slice.width = canvas.width
  slice.height = end - start
  slice.getContext("2d")?.drawImage(canvas, 0, start, canvas.width, end - start, 0, 0, canvas.width, end - start)
  return slice
}
