import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

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
  doc.text('METROPOLITAN SURVEILLANCE UNIT, NAGPUR', width / 2, 28, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('UNDER NAGPUR MUNICIPAL CORPORATION (NMC)', width / 2, 33, { align: 'center' })
  doc.text('In Technical Collaboration with NCDC Delhi, IDSP & National One Health Mission', width / 2, 38, { align: 'center' })

  // 4. Main Event Ribbon
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(180, 83, 9)
  doc.text('WORLD AMR AWARENESS WEEK (WAAW) 2026', width / 2, 48, { align: 'center' })

  // 5. Certificate Title
  let titleText = 'CERTIFICATE OF PARTICIPATION'
  if (certificateType === 'first_prize') titleText = 'CERTIFICATE OF MERIT - FIRST PRIZE'
  else if (certificateType === 'second_prize') titleText = 'CERTIFICATE OF MERIT - SECOND PRIZE'
  else if (certificateType === 'third_prize') titleText = 'CERTIFICATE OF MERIT - THIRD PRIZE'

  doc.setFontSize(22)
  doc.setTextColor(15, 23, 42)
  doc.text(titleText, width / 2, 60, { align: 'center' })

  // 6. Presentation Line
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text('This is proudly presented to', width / 2, 72, { align: 'center' })

  // 7. Student Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(30, 58, 138)
  doc.text(studentName.toUpperCase(), width / 2, 86, { align: 'center' })

  // Horizontal accent line under name
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.8)
  doc.line((width / 2) - 60, 90, (width / 2) + 60, 90)

  // 8. Academic details & Appreciation text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(51, 65, 85)
  const collegeInfo = collegeName ? `of ${collegeName}${course ? ` (${course})` : ''}` : ''
  if (collegeInfo) {
    doc.text(collegeInfo, width / 2, 98, { align: 'center' })
  }

  const descText = 'for successfully participating in the National Level Online Quiz Competition on Antimicrobial Resistance (AMR) and demonstrating exceptional commitment to Rational Drug Use and Global Antimicrobial Stewardship.'
  const splitDesc = doc.splitTextToSize(descText, 210)
  doc.text(splitDesc, width / 2, 110, { align: 'center' })

  // Score badge
  if (typeof score === 'number') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 138)
    doc.text(`Score Obtained: ${score} / ${totalQuestions}`, width / 2, 126, { align: 'center' })
  }

  // 9. QR Code generation & placement
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#1e3a8a', light: '#ffffff' }
    })
    doc.addImage(qrDataUrl, 'PNG', 30, 142, 28, 28)
  } catch (err) {
    console.error('Error generating QR for PDF:', err)
  }

  // QR label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Scan to Verify Online', 44, 173, { align: 'center' })
  doc.text(`ID: ${certificateNumber}`, 44, 177, { align: 'center' })

  // 10. Official Signatures
  // Signatory 1
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.5)
  doc.line(115, 165, 175, 165)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Dr. Anuja Maitreya', 145, 170, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Epidemiologist, MSU Nagpur', 145, 174, { align: 'center' })
  doc.text('Municipal Corporation, Nagpur', 145, 178, { align: 'center' })

  // Signatory 2
  doc.line(210, 165, 270, 165)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Nodal Officer (Health)', 240, 170, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('National AMR Program', 240, 174, { align: 'center' })
  doc.text('Metropolitan Surveillance Unit', 240, 178, { align: 'center' })

  // Bottom issue date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`Date of Issue: ${dateStr}`, width / 2, 192, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
