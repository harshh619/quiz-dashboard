'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, ROUTES } from '@/constants'
import { Profile, Competition, QuizAttempt, Certificate } from '@/types'
import { 
  Trophy, Clock, Award, CheckCircle2, AlertTriangle, 
  ChevronRight, LogOut, FileText, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react'

export default function StudentDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [userRegistrations, setUserRegistrations] = useState<string[]>([])
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({})
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!prof || !prof.college_name) {
          router.push('/register')
          return
        }
        setProfile(prof)

        // Fetch active/scheduled competitions
        const { data: comps } = await supabase
          .from('competitions')
          .select('*')
          .order('scheduled_start', { ascending: true })

        setCompetitions(comps || [])

        // Fetch user registrations
        const { data: regs } = await supabase
          .from('registrations')
          .select('competition_id')
          .eq('student_id', user.id)

        const registeredIds = (regs || []).map(r => r.competition_id)
        setUserRegistrations(registeredIds)

        // Fetch user attempts
        const { data: atts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', user.id)

        const attMap: Record<string, QuizAttempt> = {}
        atts?.forEach(a => {
          attMap[a.competition_id] = a
        })
        setAttempts(attMap)

        // Fetch user certificates
        const { data: certs } = await supabase
          .from('certificates')
          .select('*, competition:competitions(*)')
          .eq('student_id', user.id)

        setCertificates(certs || [])

      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router, supabase])

  const handleRegister = async (compId: string) => {
    if (!profile) return
    setActionLoading(compId)
    try {
      const { data, error } = await supabase.rpc('register_student_for_competition', {
        p_competition_id: compId,
        p_student_id: profile.id,
      })
      if (error) throw error
      setUserRegistrations(prev => [...prev, compId])
    } catch (err) {
      console.error('Registration failed:', err)
      alert('Registration failed. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center shadow-sm">
              AMR
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">{APP_NAME}</h1>
              <p className="text-[11px] text-gray-500">Student Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <Link 
                href="/admin/dashboard" 
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-600/50 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide mb-2 text-blue-100">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Verified Participant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">{profile?.full_name}</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-0.5 opacity-90">
              {profile?.course} · {profile?.year_semester} · {profile?.college_name}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-4 py-3 flex items-center gap-3 shrink-0">
            <div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Registration ID</div>
              <div className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
                {profile?.registration_number || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Competitions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Quiz Competitions</span>
            </h3>
            <span className="text-xs text-gray-500 font-medium">World AMR Awareness Week</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {competitions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No active competitions scheduled at this moment.
              </div>
            ) : (
              competitions.map((comp) => {
                const isRegistered = userRegistrations.includes(comp.id)
                const attempt = attempts[comp.id]
                const isAttempted = attempt && (attempt.status === 'submitted' || attempt.status === 'timed_out')
                const isInProgress = attempt && attempt.status === 'in_progress'

                const startDate = new Date(comp.scheduled_start)
                const endDate = new Date(comp.scheduled_end)
                const now = new Date()
                const isStarted = now >= startDate
                const isEnded = now >= endDate

                return (
                  <div
                    key={comp.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            30 Questions · 10 Minutes
                          </span>
                          {isAttempted && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          )}
                          {isInProgress && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-bold text-gray-900 leading-snug">
                          {comp.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                          {comp.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
                          </span>
                        </div>
                      </div>

                      {/* Action Button Area */}
                      <div className="shrink-0 flex items-center">
                        {!isRegistered ? (
                          <button
                            onClick={() => handleRegister(comp.id)}
                            disabled={actionLoading === comp.id || isEnded}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                          >
                            {actionLoading === comp.id ? 'Registering...' : 'Register for Quiz (Free)'}
                          </button>
                        ) : isAttempted ? (
                          <Link
                            href={`/result/${attempt.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <Award className="w-4 h-4" />
                            <span>View Score & Certificate</span>
                          </Link>
                        ) : isInProgress ? (
                          <Link
                            href={`/quiz/${comp.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-amber-500/20 animate-pulse transition-all"
                          >
                            <span>Resume Quiz Now</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : isStarted && !isEnded ? (
                          <Link
                            href={`/quiz/${comp.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                          >
                            <span>Start Quiz Now</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : !isStarted ? (
                          <Link
                            href={`/waiting-room/${comp.id}`}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Enter Waiting Room</span>
                          </Link>
                        ) : (
                          <div className="text-xs text-red-600 font-semibold px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                            Quiz Concluded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Certificates & Achievements */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Your Certificates & Badges</span>
            </h3>
          </div>

          {certificates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-600">No certificates issued yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Participate in the AMR Quiz and submit your answers to automatically receive your verified digital certificate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {cert.certificate_type.replace('_', ' ')}
                    </span>
                    <h5 className="font-bold text-sm text-gray-900 mt-1">
                      AMR Awareness Week Certificate
                    </h5>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      No: {cert.certificate_number}
                    </p>
                  </div>
                  <Link
                    href={`/verify/${cert.certificate_number}`}
                    className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>View / QR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
