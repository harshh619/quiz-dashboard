import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, ROUTES } from '@/constants'
import { Award, Building2, FileText, Clock, Trophy, BadgeCheck } from 'lucide-react'

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
            Metropolitan Surveillance Unit (MSU), Nagpur
          </span>
          <span className="text-gray-500 hidden sm:inline">|</span>
          <span className="text-gray-700 font-medium text-xs">
            Under Nagpur Municipal Corporation (NMC), Nagpur
          </span>
        </div>

        {/* Official Partner & Authority Logos (Clean & Balanced Showcase) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-6 py-4 px-6 bg-white/95 backdrop-blur-xs border border-gray-100 rounded-3xl max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="Nagpur Municipal Corporation (NMC)">
            <Image
              src="/nmc.png"
              alt="Nagpur Municipal Corporation (NMC)"
              width={80}
              height={80}
              className="object-contain max-h-full drop-shadow-xs"
              priority
            />
          </div>

          <div className="h-10 w-px bg-gray-200" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center p-1.5 hover:scale-105 transition-transform" title="National Centre for Disease Control (NCDC)">
            <Image
              src="/ncdc.png"
              alt="National Centre for Disease Control (NCDC)"
              width={75}
              height={75}
              className="object-contain max-h-full drop-shadow-xs"
              priority
            />
          </div>

          <div className="h-10 w-px bg-gray-200" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center p-1 hover:scale-105 transition-transform" title="Integrated Disease Surveillance Programme (IDSP)">
            <Image
              src="/idsp.png"
              alt="Integrated Disease Surveillance Programme (IDSP)"
              width={80}
              height={80}
              className="object-contain max-h-full drop-shadow-xs"
              priority
            />
          </div>

          <div className="h-10 w-px bg-gray-200" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center p-0.5 hover:scale-105 transition-transform" title="One Health Mission">
            <Image
              src="/onehealth.png"
              alt="One Health Mission"
              width={82}
              height={82}
              className="object-contain max-h-full drop-shadow-xs"
              priority
            />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mt-6 mb-4">
          Online Quiz Competition<br />
          <span className="text-blue-700">for Pharmacy Students</span>
        </h2>

        <div className="mb-8 max-w-2xl mx-auto space-y-1.5">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-blue-700/90">
            World AMR Awareness Week (WAAW) 2026
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal text-balance">
            Sensitizing Future Pharmacists on Antimicrobial Stewardship &amp; Rational Drug Use.
          </p>
        </div>

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

      {/* Key Highlights */}
      <section className="max-w-4xl mx-auto px-4 pb-14 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
          {[
            {
              icon: FileText,
              value: '30 MCQs',
              label: 'Objective Format',
              iconBg: 'bg-blue-50 text-blue-700 ring-blue-100',
              accent: 'from-blue-600 to-blue-400',
            },
            {
              icon: Clock,
              value: '10 Mins',
              label: 'Timed Assessment',
              iconBg: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
              accent: 'from-indigo-600 to-indigo-400',
            },
            {
              icon: Trophy,
              value: 'Top 3',
              label: 'Merit Awards',
              iconBg: 'bg-amber-50 text-amber-600 ring-amber-100',
              accent: 'from-amber-500 to-amber-400',
            },
            {
              icon: BadgeCheck,
              value: 'E-Certificate',
              label: 'Verified for All',
              iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
              accent: 'from-emerald-600 to-emerald-400',
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 text-center shadow-[0_2px_10px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_rgba(30,64,175,0.08)] hover:border-blue-200 transition-all duration-200 flex flex-col justify-center items-center overflow-hidden"
              >
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${stat.accent} opacity-80`} />
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} ring-1 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                  {stat.value}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1.5 font-semibold leading-tight">
                  {stat.label}
                </div>
              </div>
            )
          })}
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
            Organised by the <b>Metropolitan Surveillance Unit (MSU), Nagpur</b> under the <b>Nagpur Municipal Corporation (NMC), Nagpur</b>. Pharmacy students compete in a timed, fair, and fully digital quiz on Antimicrobial Resistance (AMR).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 text-center py-6 text-xs border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-gray-300">
            Metropolitan Surveillance Unit (MSU), Nagpur | Nagpur Municipal Corporation (NMC), Nagpur
          </p>
          <p className="text-[11px] text-gray-500">
            World AMR Awareness Week (WAAW) 2026
          </p>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <Link href="/privacy" className="hover:text-white underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-white underline-offset-2 hover:underline">
              Terms of Service
            </Link>
            <span>·</span>
            <a href="mailto:msunagpur@gmail.com" className="hover:text-white underline-offset-2 hover:underline">
              msunagpur@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
