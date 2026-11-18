import { createAdminClient } from '@/lib/supabase/admin'

export interface CertificateSignatory {
  id: string
  name: string
  designation: string
  organization: string
  signatureUrl?: string | null
}

export const CERT_BUCKET = 'certificate-assets'
export const SIGNATORIES_CONFIG_PATH = 'config/signatories.json'

export const DEFAULT_SIGNATORIES: CertificateSignatory[] = [
  {
    id: 'sig-1',
    name: 'Dr. Anuja Maitreya',
    designation: 'Epidemiologist, MSU Nagpur',
    organization: 'Nagpur Municipal Corporation, Nagpur',
    signatureUrl: null,
  },
  {
    id: 'sig-2',
    name: 'Nodal Officer (Health)',
    designation: 'National AMR Program',
    organization: 'Metropolitan Surveillance Unit, Nagpur',
    signatureUrl: null,
  },
]

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = (buckets || []).some((b) => b.name === CERT_BUCKET)
  if (!exists) {
    await admin.storage.createBucket(CERT_BUCKET, {
      public: true,
      fileSizeLimit: 5242880,
    })
  }
}

export async function getCertificateSignatories(): Promise<CertificateSignatory[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(CERT_BUCKET)
      .download(SIGNATORIES_CONFIG_PATH)

    if (error || !data) {
      return DEFAULT_SIGNATORIES
    }

    const text = await data.text()
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: String(item.id || `sig-${idx + 1}`),
        name: String(item.name || '').trim(),
        designation: String(item.designation || '').trim(),
        organization: String(item.organization || '').trim(),
        signatureUrl: item.signatureUrl || null,
      }))
    }
    return DEFAULT_SIGNATORIES
  } catch {
    return DEFAULT_SIGNATORIES
  }
}

export async function saveCertificateSignatories(
  signatories: CertificateSignatory[]
): Promise<CertificateSignatory[]> {
  const admin = createAdminClient()
  await ensureBucket(admin)

  const sanitized = signatories
    .slice(0, 4)
    .map((s, idx) => ({
      id: String(s.id || `sig-${idx + 1}`),
      name: String(s.name || '').trim() || `Signatory ${idx + 1}`,
      designation: String(s.designation || '').trim(),
      organization: String(s.organization || '').trim(),
      signatureUrl: s.signatureUrl || null,
    }))

  const jsonBuffer = Buffer.from(JSON.stringify(sanitized, null, 2), 'utf8')

  const { error } = await admin.storage
    .from(CERT_BUCKET)
    .upload(SIGNATORIES_CONFIG_PATH, jsonBuffer, {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '0',
    })

  if (error) {
    throw new Error(`Failed to save signatories config: ${error.message}`)
  }

  return sanitized
}

export async function uploadSignatoryPng(
  signatoryId: string,
  fileBuffer: Buffer
): Promise<string> {
  const admin = createAdminClient()
  await ensureBucket(admin)

  const safeId = signatoryId.replace(/[^A-Za-z0-9_-]/g, '') || 'sig'
  const filePath = `signatures/${safeId}-${Date.now()}.png`

  const { error } = await admin.storage
    .from(CERT_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(`Failed to upload PNG signature: ${error.message}`)
  }

  const { data: publicUrlData } = admin.storage
    .from(CERT_BUCKET)
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}
