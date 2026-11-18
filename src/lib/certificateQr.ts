import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const PERMANENT_VERIFIER_BASE_URL =
  process.env.NEXT_PUBLIC_PERMANENT_VERIFIER_URL ||
  'https://metropolitan-surveillance-unit.github.io/verify/'

const SECRETS_BUCKET = 'certificate-secrets'
const PRIVATE_KEY_PATH = 'ecdsa-p256-private.pem'

let cachedPrivateKey: crypto.KeyObject | null = null

async function getSigningPrivateKey(): Promise<crypto.KeyObject> {
  if (cachedPrivateKey) return cachedPrivateKey

  // 1. Optional env var override
  const envPem = process.env.CERT_ECDSA_PRIVATE_KEY
  if (envPem && envPem.includes('BEGIN PRIVATE KEY')) {
    cachedPrivateKey = crypto.createPrivateKey(envPem.replace(/\\n/g, '\n'))
    return cachedPrivateKey
  }

  // 2. Load from PRIVATE Supabase Storage bucket (inaccessible publicly; requires service role key)
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(SECRETS_BUCKET)
    .download(PRIVATE_KEY_PATH)

  if (error || !data) {
    throw new Error(
      `ECDSA signing private key could not be loaded from private storage: ${error?.message || 'missing'}`
    )
  }

  const pem = await data.text()
  cachedPrivateKey = crypto.createPrivateKey(pem)
  return cachedPrivateKey
}

function toBase64Url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/**
 * Builds a permanent, cryptographically signed (ECDSA P-256 / SHA-256) GitHub Pages verification URL.
 * Works forever with ZERO Vercel and ZERO Supabase database dependency!
 * Any single-character tampering invalidates the digital signature immediately.
 */
export async function buildSignedQrVerificationUrl(input: {
  studentName: string
  collegeName?: string
  course?: string
  certificateNumber: string
  certificateType?: string
  score?: number
  totalQuestions?: number
  dateStr: string
  eventName?: string
}): Promise<{ qrUrl: string; authCode: string }> {
  const payloadObj: Record<string, string | number> = {
    id: input.certificateNumber.trim(),
    n: input.studentName.trim().toUpperCase(),
    a: input.certificateType || 'participation',
    d: input.dateStr.trim(),
  }

  if (input.collegeName?.trim()) payloadObj.c = input.collegeName.trim()
  if (input.course?.trim()) payloadObj.cr = input.course.trim()
  if (typeof input.score === 'number') {
    payloadObj.s = input.score
    payloadObj.t = input.totalQuestions ?? 30
  }
  if (input.eventName?.trim()) payloadObj.e = input.eventName.trim()

  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(payloadObj), 'utf8'))

  const privateKey = await getSigningPrivateKey()
  const sigBuffer = crypto.sign('sha256', Buffer.from(payloadB64, 'utf8'), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  })
  const sigB64 = toBase64Url(sigBuffer)

  const base = PERMANENT_VERIFIER_BASE_URL.endsWith('/')
    ? PERMANENT_VERIFIER_BASE_URL
    : `${PERMANENT_VERIFIER_BASE_URL}/`

  const qrUrl = `${base}?p=${payloadB64}&s=${sigB64}`
  const authCode = `MSU-${sigB64.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase()}`

  return { qrUrl, authCode }
}
