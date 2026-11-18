import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  CertificateSignatory,
  getCertificateSignatories,
  saveCertificateSignatories,
  uploadSignatoryPng,
} from '@/lib/signatories'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
    return user
  }
  return null
}

// GET: Fetch current certificate signatories configuration
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const signatories = await getCertificateSignatories()
    return NextResponse.json({ signatories })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load signatories'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PUT: Save updated signatories list (add/remove/edit names, designations, count 1-4)
export async function PUT(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const list: CertificateSignatory[] = body?.signatories

    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 signatory is required.' },
        { status: 400 }
      )
    }

    if (list.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 signatories are supported on A4 landscape certificates.' },
        { status: 400 }
      )
    }

    const saved = await saveCertificateSignatories(list)
    return NextResponse.json({ success: true, signatories: saved })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save signatories'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Upload a transparent PNG signature image for a specific signatory
export async function POST(request: Request) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const signatoryId = String(formData.get('signatoryId') || '').trim()

    if (!file || !signatoryId) {
      return NextResponse.json(
        { error: 'PNG file and signatoryId are required.' },
        { status: 400 }
      )
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Signature PNG must be smaller than 2 MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Strictly verify PNG file signature (89 50 4E 47)
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47

    if (!isPng) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a PNG (.png) file only.' },
        { status: 400 }
      )
    }

    const signatureUrl = await uploadSignatoryPng(signatoryId, buffer)

    // Also update stored signatories.json if this signatoryId already exists there
    const current = await getCertificateSignatories()
    const idx = current.findIndex((s) => s.id === signatoryId)
    if (idx !== -1) {
      current[idx] = { ...current[idx], signatureUrl }
      await saveCertificateSignatories(current)
    }

    return NextResponse.json({
      success: true,
      signatureUrl,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to upload PNG signature'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
