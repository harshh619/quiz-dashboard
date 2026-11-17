import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="AMR 2026 Logo"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">{APP_NAME}</h1>
              <p className="text-xs text-gray-500">World AMR Awareness Week</p>
            </div>
          </div>
          <Link
            href={ROUTES.LOGIN}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Login / Register
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          🏆 World AMR Awareness Week 2026
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Online Quiz Competition<br />
          <span className="text-blue-700">for Pharmacy &amp; Microbiology</span>
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {APP_TAGLINE} — Test your knowledge on Antimicrobial Resistance.
          30 questions · 10 minutes · Instant certificates.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href={ROUTES.LOGIN}
            className="bg-blue-700 text-white px-8 py-3 rounded-xl text-base font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-200"
          >
            Participate Now →
          </Link>
          <a href="#about" className="bg-white text-gray-700 px-8 py-3 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
            Learn More
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Questions', value: '30 MCQs' },
            { label: 'Duration', value: '10 Minutes' },
            { label: 'Prizes', value: 'Top 3' },
            { label: 'Certificate', value: 'All Participants' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">About the Competition</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This quiz is part of the sensitization program for future healthcare practitioners.
            Pharmacy and Microbiology students compete in a timed, fair, and fully online
            quiz on Antimicrobial Resistance (AMR). Winners receive digital prize certificates;
            all valid participants receive a participation certificate with QR verification.
          </p>
        </div>
      </section>

      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm">
        <p>© 2026 {APP_NAME} · World AMR Awareness Week</p>
      </footer>
    </main>
  )
}
