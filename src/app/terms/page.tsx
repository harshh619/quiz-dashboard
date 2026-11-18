import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/constants'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: 'Official Terms of Service for the World AMR Awareness Week Quiz Portal organized by Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation.',
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-gray-800 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="AMR 2026 Logo" width={40} height={40} className="object-contain" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-xs text-gray-500">Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation</p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>
            By accessing or participating in the <strong>{APP_NAME}</strong> organized by the{' '}
            <strong>Metropolitan Surveillance Unit (MSU), Nagpur Municipal Corporation</strong>, you agree to the following official competition rules:
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">1. Single-Attempt Policy</h2>
          <p className="text-gray-600">
            Each participant is allowed strictly one authenticated attempt per scheduled quiz competition. Use of multiple accounts or automated tools may lead to disqualification.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">2. Automated Timing &amp; Evaluation</h2>
          <p className="text-gray-600">
            All quiz timers are synchronized with the server. Responses are auto-saved continuously and submitted automatically upon timer expiration. Merit rankings are determined strictly by highest score followed by fastest completion time.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">3. Official Digital Certificates</h2>
          <p className="text-gray-600">
            Valid participants receive official digital certificates verifiable via QR code on this portal. Organizer decisions regarding results and certificate issuance are final.
          </p>

          <h2 className="text-base font-bold text-gray-900 pt-2">4. Contact</h2>
          <p className="text-gray-600">
            For any queries regarding the competition or certificates, please contact{' '}
            <a href="mailto:msunagpur@gmail.com" className="text-blue-700 font-semibold underline">msunagpur@gmail.com</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
