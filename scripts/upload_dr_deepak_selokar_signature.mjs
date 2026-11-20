import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in env')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)
const CERT_BUCKET = 'certificate-assets'

async function uploadSignature() {
  const fileBuffer = fs.readFileSync('public/signatures/dr_deepak_selokar_signature.png')
  const timestamp = Date.now()
  const filePath = `signatures/dr_deepak_selokar_signature_${timestamp}.png`

  console.log(`Uploading signature to Supabase Storage: ${filePath}...`)
  const { data: uploadData, error: uploadErr } = await admin.storage
    .from(CERT_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '3600',
    })

  if (uploadErr) {
    throw new Error('Upload failed: ' + uploadErr.message)
  }

  const { data: publicUrlData } = admin.storage
    .from(CERT_BUCKET)
    .getPublicUrl(filePath)

  const publicUrl = publicUrlData.publicUrl
  console.log('Dr. Deepak Selokar Signature Public URL:', publicUrl)

  // Download current signatories
  const { data: signData, error: dlErr } = await admin.storage
    .from(CERT_BUCKET)
    .download('config/signatories.json')

  let signatories = []
  if (signData) {
    try {
      signatories = JSON.parse(await signData.text())
    } catch (e) {
      console.warn('Could not parse existing signatories JSON, resetting to defaults:', e)
    }
  }

  console.log('Current signatories before update:', signatories)

  // Update sig-2 (Dr. Deepak Selokar) with the new signatureUrl
  let found = false
  signatories = signatories.map((s) => {
    const isDrDeepak = s.id === 'sig-2' || s.name?.toLowerCase().includes('deepak') || s.name?.toLowerCase().includes('selokar')
    if (isDrDeepak) {
      found = true
      return {
        ...s,
        name: 'Dr. Deepak Selokar',
        designation: 'Medical Officer Health (MOH)',
        organization: 'Nagpur Municipal Corporation, Nagpur',
        organizationLine2: '',
        signatureUrl: publicUrl,
      }
    }
    return s
  })

  if (!found) {
    signatories.push({
      id: 'sig-2',
      name: 'Dr. Deepak Selokar',
      designation: 'Medical Officer Health (MOH)',
      organization: 'Nagpur Municipal Corporation, Nagpur',
      organizationLine2: '',
      signatureUrl: publicUrl,
    })
  }

  console.log('Updated signatories to save:', signatories)

  // Upload updated signatories.json
  const { error: saveErr } = await admin.storage
    .from(CERT_BUCKET)
    .upload('config/signatories.json', Buffer.from(JSON.stringify(signatories, null, 2)), {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '0',
    })

  if (saveErr) {
    throw new Error('Failed to save signatories.json: ' + saveErr.message)
  }

  console.log('Successfully updated config/signatories.json with Dr. Deepak Selokar signature!')
}

uploadSignature().catch((err) => {
  console.error('Error uploading signature:', err)
  process.exit(1)
})
