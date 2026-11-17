import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants'
import { ShieldCheck, Award, Building2 } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white to-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="AMR 2026 Logo"
              width={46}
              height={46}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{APP_NAME}</h1>
              <p className="text-[11px] text-gray-500 font-medium">World AMR Awareness Week 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Login / Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-12 text-center">
        {/* Organizer Official Tag */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 bg-blue-50 border border-blue-200 text-blue-950 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold mb-6 shadow-xs">
          <div className="flex items-center gap-1.5 text-blue-700">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Organised by:</span>
          </div>
          <span className="font-bold text-blue-900">
            Metropolitan Surveillance Unit, Nagpur
          </span>
          <span className="text-gray-500 hidden sm:inline">|</span>
          <span className="text-gray-700 font-medium text-xs">
            Under Nagpur Municipal Corporation (NMC)
          </span>
        </div>

        {/* Official Partner & Authority Logos (Clean Showcase) */}
        <div className="flex items-center justify-center gap-4 sm:gap-7 my-5 py-3.5 px-6 bg-white/90 backdrop-blur-xs border border-gray-100 rounded-3xl max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="Nagpur Municipal Corporation (NMC)">
            <Image
              src="/nmc.png"
              alt="Nagpur Municipal Corporation (NMC)"
              width={64}
              height={64}
              className="object-contain drop-shadow-xs max-h-full"
            />
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="National Centre for Disease Control (NCDC)">
            <Image
              src="/ncdc.png"
              alt="National Centre for Disease Control (NCDC)"
              width={56}
              height={56}
              className="object-contain drop-shadow-xs max-h-full"
            />
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="Integrated Disease Surveillance Programme (IDSP)">
            <Image
              src="/idsp.png"
              alt="Integrated Disease Surveillance Programme (IDSP)"
              width={64}
              height={64}
              className="object-contain drop-shadow-xs max-h-full"
            />
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="One Health Mission">
            <Image
              src="/onehealth.png"
              alt="One Health Mission"
              width={64}
              height={64}
              className="object-contain drop-shadow-xs max-h-full"
            />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mt-6 mb-4">
          Online Quiz Competition<br />
          <span className="text-blue-700">for Pharmacy &amp; Microbiology</span>
        </h2>

        <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          {APP_TAGLINE} — Sensitization of Future Healthcare Practitioners on Antimicrobial Stewardship.
          30 questions · 10 minutes · Instant verified certificates.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={ROUTES.LOGIN}
            className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
          >
            Participate Now →
          </Link>
          <a
            href="#about"
            className="bg-white hover:bg-gray-50 text-gray-700 px-7 py-3.5 rounded-2xl text-sm sm:text-base font-semibold border border-gray-200 transition-colors shadow-xs"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-4xl mx-auto px-4 pb-12 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {[
            { label: 'Questions', value: '30 MCQs' },
            { label: 'Duration', value: '10 Minutes' },
            { label: 'Top Prizes', value: '1st, 2nd, 3rd' },
            { label: 'Verified Certificate', value: 'All Participants' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 text-center shadow-xs flex flex-col justify-center items-center min-h-[110px]"
            >
              <div className="text-xl sm:text-2xl font-black text-blue-700 leading-tight">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>National Awareness Initiative</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">About the Competition</h3>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Organised by the <b>Metropolitan Surveillance Unit (MSU), Nagpur</b> under the <b>Nagpur Municipal Corporation (NMC)</b> in collaboration with national disease surveillance bodies (<b>NCDC &amp; IDSP</b>). Pharmacy and Microbiology students compete in a timed, fair, and fully digital quiz on Antimicrobial Resistance (AMR).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 text-center py-6 text-xs border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-gray-300">
            Metropolitan Surveillance Unit, Nagpur · Nagpur Municipal Corporation (NMC)
          </p>
          <p className="text-[11px] text-gray-500">
            In technical collaboration with NCDC Delhi &amp; IDSP India · World AMR Awareness Week (WAAW) 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
