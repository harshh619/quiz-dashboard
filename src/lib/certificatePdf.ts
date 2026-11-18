import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { CertificateSignatory, getCertificateSignatories } from '@/lib/signatories'
import { buildSelfContainedQrPayload } from '@/lib/certificateQr'

async function fetchPngAsDataUrlWithDimensions(url: string): Promise<{
  dataUrl: string
  width: number
  height: number
} | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    const buf = Buffer.from(arrayBuffer)

    // Verify PNG magic signature (89 50 4E 47) and read IHDR dimensions
    let width = 300
    let height = 100
    if (
      buf.length >= 24 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      width = buf.readUInt32BE(16) || 300
      height = buf.readUInt32BE(20) || 100
    }

    const base64 = buf.toString('base64')
    return {
      dataUrl: `data:image/png;base64,${base64}`,
      width,
      height,
    }
  } catch (err) {
    console.error('Failed to fetch signatory PNG:', err)
    return null
  }
}

export async function generateCertificatePdfBuffer({
  studentName,
  collegeName,
  course,
  certificateNumber,
  certificateType = 'participation',
  verificationUrl,
  score,
  totalQuestions = 30,
  dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
  signatories: customSignatories,
}: {
  studentName: string
  collegeName?: string
  course?: string
  certificateNumber: string
  certificateType?: string
  verificationUrl: string
  score?: number
  totalQuestions?: number
  dateStr?: string
  signatories?: CertificateSignatory[]
}): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297mm x 210mm
  })

  const width = 297
  const height = 210

  // 1. Background fill
  doc.setFillColor(254, 255, 255)
  doc.rect(0, 0, width, height, 'F')

  // 2. Elegant double borders
  doc.setDrawColor(30, 58, 138) // Deep Blue
  doc.setLineWidth(3)
  doc.rect(10, 10, width - 20, height - 20)

  doc.setDrawColor(217, 119, 6) // Golden Amber
  doc.setLineWidth(1)
  doc.rect(14, 14, width - 28, height - 28)

  // 3. Top Header: Authority & Initiative
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 58, 138)
  doc.text('METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR', width / 2, 27, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('UNDER NAGPUR MUNICIPAL CORPORATION (NMC), NAGPUR', width / 2, 32.5, { align: 'center' })
  doc.text('World AMR Awareness Week (WAAW) 2026 · National Awareness Initiative', width / 2, 37.5, { align: 'center' })

  // 4. Main Event Ribbon
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(180, 83, 9)
  doc.text('WORLD AMR AWARENESS WEEK (WAAW) 2026', width / 2, 47.5, { align: 'center' })

  // 5. Certificate Title
  let titleText = 'CERTIFICATE OF PARTICIPATION'
  if (certificateType === 'first_prize') titleText = 'CERTIFICATE OF MERIT - FIRST PRIZE'
  else if (certificateType === 'second_prize') titleText = 'CERTIFICATE OF MERIT - SECOND PRIZE'
  else if (certificateType === 'third_prize') titleText = 'CERTIFICATE OF MERIT - THIRD PRIZE'

  doc.setFontSize(22)
  doc.setTextColor(15, 23, 42)
  doc.text(titleText, width / 2, 59, { align: 'center' })

  // 6. Presentation Line
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text('This is proudly presented to', width / 2, 70, { align: 'center' })

  // 7. Student Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(25)
  doc.setTextColor(30, 58, 138)
  doc.text(studentName.toUpperCase(), width / 2, 83, { align: 'center' })

  // Horizontal accent line under name
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.8)
  doc.line(width / 2 - 60, 87, width / 2 + 60, 87)

  // 8. Academic details & Appreciation text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(51, 65, 85)
  const collegeInfo = collegeName ? `of ${collegeName}${course ? ` (${course})` : ''}` : ''
  if (collegeInfo) {
    doc.text(collegeInfo, width / 2, 95, { align: 'center' })
  }

  const descText =
    'for participating in the Online Quiz Competition for Health Sciences Students on Antimicrobial Resistance (AMR) and demonstrating commitment to Rational Drug Use and Global Antimicrobial Stewardship.'
  const splitDesc = doc.splitTextToSize(descText, 215)
  doc.text(splitDesc, width / 2, 106, { align: 'center' })

  // Score badge
  if (typeof score === 'number') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 138)
    doc.text(`Score Obtained: ${score} / ${totalQuestions}`, width / 2, 121, { align: 'center' })
  }

  // 9. Self-Contained Tamper-Proof Offline QR Code (Works forever without Vercel/DB)
  const { qrPayload, authCode } = buildSelfContainedQrPayload({
    studentName,
    collegeName,
    course,
    certificateNumber,
    certificateType,
    score,
    totalQuestions,
    dateStr,
  })

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e3a8a', light: '#ffffff' },
    })
    doc.addImage(qrDataUrl, 'PNG', 24, 138, 31, 31)
  } catch (err) {
    console.error('Error generating QR for PDF:', err)
  }

  // QR label & Auth Code
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.setTextColor(30, 58, 138)
  doc.text('Scan QR to Verify', 39.5, 173, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(100, 116, 139)
  doc.text(`ID: ${certificateNumber}`, 39.5, 176.8, { align: 'center' })
  doc.text(`Auth: ${authCode}`, 39.5, 180.4, { align: 'center' })

  // 10. Dynamic Official Signatories (Supports 1 to 4 Signatories with Transparent PNG Signatures!)
  const activeSignatories =
    customSignatories && customSignatories.length > 0
      ? customSignatories.slice(0, 4)
      : await getCertificateSignatories()

  const sigCount = activeSignatories.length
  if (sigCount > 0) {
    // Available horizontal zone to the right of QR code: x = 74mm .. 278mm (total 204mm)
    const zoneStart = 74
    const zoneWidth = 204
    const slotWidth = zoneWidth / sigCount
    const lineHalfWidth = sigCount === 4 ? 22 : sigCount === 3 ? 27 : 31
    const maxSigImgW = sigCount === 4 ? 36 : 44
    const maxSigImgH = 15
    const lineY = 165

    // Fetch all PNG signatures in parallel
    const sigImages = await Promise.all(
      activeSignatories.map((s) =>
        s.signatureUrl ? fetchPngAsDataUrlWithDimensions(s.signatureUrl) : Promise.resolve(null)
      )
    )

    activeSignatories.forEach((sig, i) => {
      const centerX = zoneStart + slotWidth * i + slotWidth / 2
      const img = sigImages[i]

      // Render uploaded transparent PNG signature centered just above the signature line
      if (img) {
        const aspect = img.width / img.height
        let drawW = maxSigImgW
        let drawH = drawW / aspect
        if (drawH > maxSigImgH) {
          drawH = maxSigImgH
          drawW = drawH * aspect
        }
        try {
          doc.addImage(
            img.dataUrl,
            'PNG',
            centerX - drawW / 2,
            lineY - drawH - 1.5,
            drawW,
            drawH
          )
        } catch (err) {
          console.error('Error embedding signatory PNG:', err)
        }
      }

      // Signature horizontal line
      doc.setDrawColor(148, 163, 184)
      doc.setLineWidth(0.5)
      doc.line(centerX - lineHalfWidth, lineY, centerX + lineHalfWidth, lineY)

      // Signatory Name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(sigCount === 4 ? 8.5 : 9.5)
      doc.setTextColor(15, 23, 42)
      const nameLines = doc.splitTextToSize(sig.name || '', slotWidth - 6)
      doc.text(nameLines, centerX, lineY + 4.8, { align: 'center' })

      // Signatory Designation
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(sigCount === 4 ? 7.2 : 8)
      doc.setTextColor(100, 116, 139)
      const desigOffset = lineY + 4.8 + nameLines.length * 3.8
      if (sig.designation) {
        const desigLines = doc.splitTextToSize(sig.designation, slotWidth - 6)
        doc.text(desigLines, centerX, desigOffset, { align: 'center' })

        if (sig.organization) {
          const orgLines = doc.splitTextToSize(sig.organization, slotWidth - 6)
          doc.text(orgLines, centerX, desigOffset + desigLines.length * 3.5, { align: 'center' })
        }
      } else if (sig.organization) {
        const orgLines = doc.splitTextToSize(sig.organization, slotWidth - 6)
        doc.text(orgLines, centerX, desigOffset, { align: 'center' })
      }
    })
  }

  // Bottom issue date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Date of Issue: ${dateStr}`, width / 2, 192, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
