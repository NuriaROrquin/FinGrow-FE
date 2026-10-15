import { receiptScanMaxSizeBytes } from "@/lib/api/receipts"

const maxDimension = 2000
const jpegQualities = [0.85, 0.7, 0.55]
const pdfType = "application/pdf"

export type ReceiptImageProblem = "unsupported" | "heic" | "tooLarge"

export class ReceiptImageError extends Error {
  readonly problem: ReceiptImageProblem

  constructor(problem: ReceiptImageProblem) {
    super(problem)
    this.name = "ReceiptImageError"
    this.problem = problem
  }
}

export const receiptScanInputAccept = "image/*,.heic,.heif,application/pdf,.pdf"

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || isHeic(file)
}

function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "comprobante"
  return `${base}.jpg`
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
}

function draw(image: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

  const context = canvas.getContext("2d")
  if (!context) {
    throw new ReceiptImageError("unsupported")
  }

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

export async function compressReceiptImage(source: Blob, name: string): Promise<File> {
  const url = URL.createObjectURL(source)
  const image = new Image()
  image.src = url

  try {
    try {
      await image.decode()
    } catch {
      throw new ReceiptImageError(source instanceof File && isHeic(source) ? "heic" : "unsupported")
    }

    const canvas = draw(image)

    for (const quality of jpegQualities) {
      const blob = await toBlob(canvas, quality)
      if (blob && blob.size <= receiptScanMaxSizeBytes) {
        return new File([blob], jpegName(name), { type: "image/jpeg" })
      }
    }

    throw new ReceiptImageError("tooLarge")
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function prepareReceiptForScan(file: File): Promise<File> {
  if (file.type === pdfType || /\.pdf$/i.test(file.name)) {
    if (file.size > receiptScanMaxSizeBytes) {
      throw new ReceiptImageError("tooLarge")
    }

    return file.type === pdfType ? file : new File([file], file.name, { type: pdfType })
  }

  if (!isImage(file)) {
    throw new ReceiptImageError("unsupported")
  }

  return compressReceiptImage(file, file.name)
}
