import fs from 'fs'
import path from 'path'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { CertificateSignatory, getCertificateSignatories } from '@/lib/signatories'
import { buildSignedQrVerificationUrl } from '@/lib/certificateQr'

interface LoadedPng {
  dataUrl: string
  width: number
  height: number
}

const PUBLIC_LOGO_CACHE = new Map<string, LoadedPng>()
const FALLBACK_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://quiz-msu-nagpur.vercel.app'

function parsePngDimensions(buf: Buffer): { width: number; height: number } {
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
  return { width, height }
}

async function loadPublicLogoPng(filename: string): Promise<LoadedPng | null> {
  const cached = PUBLIC_LOGO_CACHE.get(filename)
  if (cached) return cached

  let buf: Buffer | null = null

  // 1. Fast local disk read from public/ (zero network overhead)
  try {
    const filePath = path.join(process.cwd(), 'public', filename)
    if (fs.existsSync(filePath)) {
      buf = fs.readFileSync(filePath)
    }
  } catch (err) {
    console.warn(`Local disk read failed for ${filename}, trying HTTP fallback:`, err)
  }

  // 2. Fallback to deployed public URL if serverless bundle omitted public/
  if (!buf) {
    try {
      const res = await fetch(`${FALLBACK_PUBLIC_BASE_URL}/${filename}`, { cache: 'force-cache' })
      if (res.ok) {
        buf = Buffer.from(await res.arrayBuffer())
      }
    } catch (err) {
      console.error(`HTTP fallback failed for logo ${filename}:`, err)
    }
  }

  if (!buf) return null

  const { width, height } = parsePngDimensions(buf)
  const loaded: LoadedPng = {
    dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
    width,
    height,
  }
  PUBLIC_LOGO_CACHE.set(filename, loaded)
  return loaded
}

async function fetchPngAsDataUrlWithDimensions(url: string): Promise<LoadedPng | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    const buf = Buffer.from(arrayBuffer)
    const { width, height } = parsePngDimensions(buf)

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

async function loadSignatoryPng(sig: CertificateSignatory): Promise<LoadedPng | null> {
  let url = sig.signatureUrl
  if (!url) {
    const nameLower = (sig.name || '').toLowerCase()
    if (nameLower.includes('sandeep') || nameLower.includes('bhoyar')) {
      url = '/signatures/dr_sandeep_bhoyar_signature.png'
    } else if (nameLower.includes('deepak') || nameLower.includes('selokar')) {
      url = '/signatures/dr_deepak_selokar_signature.png'
    }
  }
  if (!url) return null

  // Fast local disk check if relative or filename matches known local signatures
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const rel = url.replace(/^\/+/, '')
    const localPath = path.join(process.cwd(), 'public', rel)
    if (fs.existsSync(localPath)) {
      try {
        const buf = fs.readFileSync(localPath)
        const { width, height } = parsePngDimensions(buf)
        return {
          dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
          width,
          height,
        }
      } catch (err) {
        console.warn('Local disk read failed for signature:', err)
      }
    }
    url = `${FALLBACK_PUBLIC_BASE_URL}/${rel}`
  }

  // Also check local disk for known signature URLs to save HTTP roundtrip
  if (url.includes('dr_sandeep_bhoyar_signature')) {
    const localPath = path.join(process.cwd(), 'public', 'signatures', 'dr_sandeep_bhoyar_signature.png')
    if (fs.existsSync(localPath)) {
      try {
        const buf = fs.readFileSync(localPath)
        const { width, height } = parsePngDimensions(buf)
        return {
          dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
          width,
          height,
        }
      } catch {
        // fallback to fetch
      }
    }
  }
  if (url.includes('dr_deepak_selokar_signature')) {
    const localPath = path.join(process.cwd(), 'public', 'signatures', 'dr_deepak_selokar_signature.png')
    if (fs.existsSync(localPath)) {
      try {
        const buf = fs.readFileSync(localPath)
        const { width, height } = parsePngDimensions(buf)
        return {
          dataUrl: `data:image/png;base64,${buf.toString('base64')}`,
          width,
          height,
        }
      } catch {
        // fallback to fetch
      }
    }
  }

  return fetchPngAsDataUrlWithDimensions(url)
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

  // 2.5 Top Official Partner Logos (Full-Resolution PNGs: 2 Left [NMC, NCDC] · 2 Right [NHM, One Health])
  const headerLogos = await Promise.all([
    loadPublicLogoPng('nmc.png'),
    loadPublicLogoPng('ncdc.png'),
    loadPublicLogoPng('nhm.png'),
    loadPublicLogoPng('onehealth.png'),
  ])

  const logoSlots = [
    { img: headerLogos[0], centerX: 33, centerY: 31, maxW: 22, maxH: 21, alias: 'logo_nmc' },
    { img: headerLogos[1], centerX: 62, centerY: 31, maxW: 20, maxH: 21, alias: 'logo_ncdc' },
    { img: headerLogos[2], centerX: 235, centerY: 31, maxW: 24, maxH: 21, alias: 'logo_nhm' },
    { img: headerLogos[3], centerX: 264, centerY: 31, maxW: 22, maxH: 21, alias: 'logo_onehealth' },
  ]

  for (const slot of logoSlots) {
    if (!slot.img) continue
    const aspect = slot.img.width / slot.img.height
    let drawW = slot.maxW
    let drawH = drawW / aspect
    if (drawH > slot.maxH) {
      drawH = slot.maxH
      drawW = drawH * aspect
    }
    try {
      doc.addImage(
        slot.img.dataUrl,
        'PNG',
        slot.centerX - drawW / 2,
        slot.centerY - drawH / 2,
        drawW,
        drawH,
        slot.alias,
        'FAST'
      )
    } catch (err) {
      console.error(`Error embedding header logo ${slot.alias}:`, err)
    }
  }

  // 3. Top Header: NMC (Primary Authority - Larger Font) & MSU (Operating Unit - Medium Font)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 58, 138)
  doc.text('NAGPUR MUNICIPAL CORPORATION (NMC), NAGPUR', width / 2, 26.5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(51, 65, 85)
  doc.text('METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR', width / 2, 33.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(100, 116, 139)
  doc.text('National Awareness Initiative · Antimicrobial Resistance (AMR) Containment', width / 2, 39.5, { align: 'center' })

  // 4. Main Event Ribbon
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(180, 83, 9)
  doc.text('WORLD AMR AWARENESS WEEK (WAAW) 2026', width / 2, 49, { align: 'center' })

  // 5. Certificate Title
  let titleText = 'CERTIFICATE OF PARTICIPATION'
  if (certificateType === 'first_prize') titleText = 'CERTIFICATE OF MERIT - FIRST PRIZE'
  else if (certificateType === 'second_prize') titleText = 'CERTIFICATE OF MERIT - SECOND PRIZE'
  else if (certificateType === 'third_prize') titleText = 'CERTIFICATE OF MERIT - THIRD PRIZE'

  doc.setFontSize(25)
  doc.setTextColor(15, 23, 42)
  doc.text(titleText, width / 2, 61, { align: 'center' })

  // 6. Presentation Line
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(13)
  doc.setTextColor(100, 116, 139)
  doc.text('This is proudly presented to', width / 2, 71, { align: 'center' })

  // 7. Participant Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(27)
  doc.setTextColor(30, 58, 138)
  doc.text(studentName.toUpperCase(), width / 2, 82.5, { align: 'center' })

  // Horizontal accent line under name
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.9)
  doc.line(width / 2 - 70, 86, width / 2 + 70, 86)

  // 8. Designation / Health Facility details & Appreciation text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13.5)
  doc.setTextColor(51, 65, 85)
  const isPharmacyOfficer = !course || course.toLowerCase() === 'pharmacy officer' || course.toLowerCase() === 'pharmacist'
  const affiliationLine = collegeName
    ? isPharmacyOfficer
      ? `Pharmacy Officer, ${collegeName}`
      : `of ${collegeName}${course ? ` (${course})` : ''}`
    : isPharmacyOfficer
    ? 'Pharmacy Officer'
    : course || ''

  if (affiliationLine) {
    doc.text(affiliationLine, width / 2, 94.5, { align: 'center' })
  }

  let achievementPhrase = 'for actively participating in'
  if (certificateType === 'first_prize') achievementPhrase = 'for securing First Prize in'
  else if (certificateType === 'second_prize') achievementPhrase = 'for securing Second Prize in'
  else if (certificateType === 'third_prize') achievementPhrase = 'for securing Third Prize in'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  const descText = `${achievementPhrase} the Online Quiz Competition for Pharmacy Officers on Antimicrobial Resistance (AMR) and demonstrating commitment to Rational Drug Use and Antimicrobial Stewardship.`
  const splitDesc = doc.splitTextToSize(descText, 226)
  doc.text(splitDesc, width / 2, 104, { align: 'center', lineHeightFactor: 1.35 })

  // Score badge
  if (typeof score === 'number') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(30, 58, 138)
    doc.text(`Score Obtained: ${score} / ${totalQuestions}`, width / 2, 118, { align: 'center' })
  }

  // 8.5 Official One Health / AMR Slogan Block
  doc.setFont('times', 'bold')
  doc.setFontSize(13.5)
  doc.setTextColor(11, 37, 102)
  doc.text('ONE HEALTH, ONE ACTION', width / 2, 128.5, { align: 'center' })
  doc.text('PREVENT AMR NOW!', width / 2, 135, { align: 'center' })
  doc.setFontSize(11.5)
  doc.text('Protect \u2022 Humans \u2022 Animals \u2022 Environment', width / 2, 141.5, { align: 'center' })

  // 9. Cryptographically Signed (ECDSA P-256) Permanent GitHub Pages Verification QR
  let qrTarget = verificationUrl
  let authCode = ''
  try {
    const signed = await buildSignedQrVerificationUrl({
      studentName,
      collegeName,
      course,
      certificateNumber,
      certificateType,
      score,
      totalQuestions,
      dateStr,
      eventName: 'World AMR Awareness Week (WAAW) 2026',
    })
    qrTarget = signed.qrUrl
    authCode = signed.authCode
  } catch (err) {
    console.error('Error signing QR URL, falling back to verificationUrl:', err)
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e3a8a', light: '#ffffff' },
    })
    doc.addImage(qrDataUrl, 'PNG', 24, 143, 31, 31)
  } catch (err) {
    console.error('Error generating QR for PDF:', err)
  }

  // QR label & Digital Seal Code
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(30, 58, 138)
  doc.text('Scan QR to Verify', 39.5, 178, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`ID: ${certificateNumber}`, 39.5, 181.8, { align: 'center' })
  if (authCode) {
    doc.text(`Seal: ${authCode}`, 39.5, 185.4, { align: 'center' })
  }

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
    const lineY = 166

    // Fetch all PNG signatures in parallel
    const sigImages = await Promise.all(
      activeSignatories.map((s) => loadSignatoryPng(s))
    )

    activeSignatories.forEach((sig, i) => {
      const centerX = zoneStart + slotWidth * i + slotWidth / 2
      const img = sigImages[i]

      // Render uploaded transparent PNG signature centered just above the signature line
      if (img) {
        const aspect = img.width / img.height
        // Allow taller headroom for multi-tier signatures (aspect < 1.7) so the signature is balanced with landscape signatures
        const effectiveMaxH = aspect < 1.7 ? (sigCount === 4 ? 17 : 20.5) : (sigCount === 4 ? 13 : 15.5)
        const effectiveMaxW = maxSigImgW
        let drawW = effectiveMaxW
        let drawH = drawW / aspect
        if (drawH > effectiveMaxH) {
          drawH = effectiveMaxH
          drawW = drawH * aspect
        }
        try {
          // Exactly 0.2mm above lineY so signature rests cleanly directly on the line with zero floating gap
          doc.addImage(
            img.dataUrl,
            'PNG',
            centerX - drawW / 2,
            lineY - drawH - 0.2,
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
      doc.setFontSize(sigCount === 4 ? 9.5 : 11)
      doc.setTextColor(15, 23, 42)
      const textMaxW = slotWidth - 4
      const nameLines = doc.splitTextToSize(sig.name || '', textMaxW)
      doc.text(nameLines, centerX, lineY + 5, { align: 'center' })

      // Signatory Designation + Organization Line 1 + Organization Line 2
      doc.setFont('helvetica', 'normal')
      const subFontSize = sigCount === 4 ? 7.5 : sigCount === 3 ? 8.2 : 9.0
      doc.setFontSize(subFontSize)
      doc.setTextColor(100, 116, 139)

      const lineStep = sigCount === 4 ? 3.5 : 3.8
      let cursorY = lineY + 5 + nameLines.length * 4.2
      const subLines = [sig.designation, sig.organization, sig.organizationLine2]
        .map((v) => (v || '').trim())
        .filter(Boolean)

      for (const lineText of subLines) {
        const wrapped = doc.splitTextToSize(lineText, textMaxW)
        doc.text(wrapped, centerX, cursorY, { align: 'center' })
        cursorY += wrapped.length * lineStep
      }
    })
  }

  // Bottom issue date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184)
  doc.text(`Date of Issue: ${dateStr}`, width / 2, 193.5, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
