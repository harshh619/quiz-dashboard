import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/constants'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description: 'Official Privacy Policy for the World AMR Awareness Week Quiz Portal organized by Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="AMR 2026 Logo" width={40} height={40} className="object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-xs text-gray-500">Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation</p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>
            The <strong>{APP_NAME}</strong> is an official educational quiz portal organized by the{' '}
            <strong>Metropolitan Surveillance Unit (MSU), Nagpur</strong> under the{' '}
            <strong>Nagpur Municipal Corporation (NMC)</strong> in alignment with NCDC, IDSP, and the National One Health Mission.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">1. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-600">
            <li><strong>Google Account Information:</strong> Name and email address provided via Google Sign-In solely to authenticate participants and prevent duplicate quiz attempts.</li>
            <li><strong>Academic &amp; Registration Details:</strong> College/institution name, course, year/semester, and contact number submitted during participant registration.</li>
            <li><strong>Quiz Participation Records:</strong> Selected answers, scores, timestamps, and issued official certificate records.</li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-600">
            <li>To verify participant identity and maintain fair single-attempt online examination integrity.</li>
            <li>To evaluate quiz responses, compute official merit rankings, and issue verifiable digital certificates.</li>
            <li>To email official PDF certificates from <strong>msunagpur@gmail.com</strong>.</li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 pt-2">3. Data Protection &amp; Sharing</h2>
          <p className="text-gray-600">
            Participant information is stored securely and is never sold or shared with third-party advertisers. Certificate verification pages display only official credential status (name, institution, award category, and certificate ID) when verified via QR code or certificate number.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">4. Contact Official Organizer</h2>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-xs text-blue-950">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Metropolitan Surveillance Unit (MSU), Nagpur</strong><br />
              Nagpur Municipal Corporation (NMC), Nagpur, Maharashtra<br />
              Official Support Email: <a href="mailto:msunagpur@gmail.com" className="text-blue-700 font-semibold underline">msunagpur@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
