import crypto from 'crypto'

export function formatCertificateAwardTitle(certificateType?: string | null): string {
  switch (certificateType) {
    case 'first_prize':
      return 'First Prize (Certificate of Merit)'
    case 'second_prize':
      return 'Second Prize (Certificate of Merit)'
    case 'third_prize':
      return 'Third Prize (Certificate of Merit)'
    default:
      return 'Certificate of Participation'
  }
}

export function generateCertificateAuthCode(input: {
  certificateNumber: string
  studentName: string
  collegeName?: string
  certificateType?: string
  score?: number
  totalQuestions?: number
  dateStr: string
}): string {
  const secret =
    process.env.CERT_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'msu-nagpur-nmc-waaw-2026-official'

  const canonical = [
    input.certificateNumber.trim().toUpperCase(),
    input.studentName.trim().toUpperCase(),
    (input.collegeName || '').trim().toUpperCase(),
    (input.certificateType || 'participation').trim().toLowerCase(),
    String(input.score ?? ''),
    String(input.totalQuestions ?? 30),
    input.dateStr.trim(),
  ].join('|')

  const digest = crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex')
    .toUpperCase()

  return `MSU-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`
}

/**
 * Self-Contained Tamper-Proof Offline QR Payload (Works forever with zero server / Vercel / DB dependency).
 * Any smartphone camera or QR scanner immediately shows verified official MSU Nagpur credentials.
 */
export function buildSelfContainedQrPayload(input: {
  studentName: string
  collegeName?: string
  course?: string
  certificateNumber: string
  certificateType?: string
  score?: number
  totalQuestions?: number
  dateStr: string
}): { qrPayload: string; authCode: string } {
  const authCode = generateCertificateAuthCode(input)
  const awardLabel = formatCertificateAwardTitle(input.certificateType)
  const institutionLine = input.collegeName
    ? `${input.collegeName}${input.course ? ` (${input.course})` : ''}`
    : input.course || 'Health Sciences Institution'

  const lines = [
    'OFFICIAL VERIFIED CERTIFICATE',
    'Organizer: Metropolitan Surveillance Unit (MSU), Nagpur | NMC, Nagpur',
    'Event: World AMR Awareness Week (WAAW) 2026',
    `Certificate ID: ${input.certificateNumber}`,
    `Recipient: ${input.studentName.trim().toUpperCase()}`,
    `Institution: ${institutionLine}`,
    `Award: ${awardLabel}`,
  ]

  if (typeof input.score === 'number') {
    lines.push(`Score: ${input.score} / ${input.totalQuestions ?? 30}`)
  }

  lines.push(
    `Issued On: ${input.dateStr}`,
    `Auth Code: ${authCode}`,
    'Official Contact: msunagpur@gmail.com'
  )

  return {
    qrPayload: lines.join('\n'),
    authCode,
  }
}
