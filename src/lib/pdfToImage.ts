/**
 * Client-side utility: Fetches the official PDF certificate and renders it
 * as a high-resolution PNG image using PDF.js (pdfjs-dist).
 *
 * Used by:
 * 1. Digital Certificate Preview (displays the official PDF as an <img>)
 * 2. "Save as Image (PNG)" button (downloads the rendered PNG)
 */

let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function ensurePdfJs() {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  // Use local worker hosted directly from public folder (zero network / CDN dependency)
  if (typeof window !== 'undefined') {
    lib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs'
  }
  pdfjsLib = lib
  return lib
}

export interface PdfImageResult {
  blobUrl: string
  blob: Blob
  file: File
  width: number
  height: number
}

/**
 * Fetches the PDF from the given URL, renders page 1 at the given scale,
 * and returns a PNG Blob + object URL.
 */
export async function renderPdfAsImage(
  pdfUrl: string,
  fileName: string,
  scale = 2.5
): Promise<PdfImageResult> {
  const lib = await ensurePdfJs()

  // 1. Fetch PDF as ArrayBuffer
  const res = await fetch(pdfUrl)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error((errData as { error?: string }).error || 'Failed to fetch certificate PDF')
  }
  const arrayBuffer = await res.arrayBuffer()

  // 2. Load PDF document
  const loadingTask = lib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdfDoc = await loadingTask.promise

  // 3. Get page 1
  const page = await pdfDoc.getPage(1)
  const viewport = page.getViewport({ scale })

  // 4. Create off-screen canvas
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 5. Render PDF page to canvas
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise

  // 6. Convert canvas to PNG Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to generate PNG blob'))),
      'image/png'
    )
  })

  const blobUrl = URL.createObjectURL(blob)
  const file = new File([blob], fileName, { type: 'image/png' })

  // Cleanup PDF.js resources
  pdfDoc.destroy()

  return {
    blobUrl,
    blob,
    file,
    width: viewport.width,
    height: viewport.height,
  }
}
