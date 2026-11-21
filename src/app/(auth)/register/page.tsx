'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { HEALTH_FACILITIES } from '@/constants'
import { formatPersonName, formatCollegeName } from '@/lib/textFormat'
import { isProfileComplete } from '@/lib/profileValidation'
import { User, Building2, Phone, CheckCircle, AlertCircle, Info, ShieldCheck } from 'lucide-react'

export default function RegisterProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    designation: '',
    other_designation: '',
    health_facility: '',
    other_facility: '',
    mobile: '',
  })

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const search = typeof window !== 'undefined' ? window.location.search : ''
        const redirectParam = search
          ? `/login?redirect=${encodeURIComponent(`/register${search}`)}`
          : '/login?redirect=/register'
        router.push(redirectParam)
        return
      }

      // Check if profile is already 100% complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (isProfileComplete(profile)) {
        // Already completed profile, redirect directly to dashboard or target
        const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
        const saved = typeof window !== 'undefined' ? sessionStorage.getItem('auth_redirect_target') || localStorage.getItem('auth_redirect_target') : null
        const dest = (search && search.startsWith('/')) ? search : (saved && saved.startsWith('/') ? saved : '/dashboard')
        router.push(dest)
        return
      }

      if (profile) {
        const existingFacility = (profile.college_name || '').trim()
        const isKnownFacility = HEALTH_FACILITIES.includes(
          existingFacility as (typeof HEALTH_FACILITIES)[number]
        )

        const existingCourse = (profile.course || '').trim()
        const isPharmacyOfficer = existingCourse.toLowerCase() === 'pharmacy officer'
        const hasOtherCourse = existingCourse && !isPharmacyOfficer && existingCourse.toUpperCase() !== 'OTHER'

        setFormData({
          full_name: formatPersonName(profile.full_name || user.user_metadata?.full_name || '', true),
          designation: isPharmacyOfficer ? 'Pharmacy Officer' : hasOtherCourse ? 'OTHER' : '',
          other_designation: hasOtherCourse ? existingCourse : '',
          health_facility: isKnownFacility
            ? existingFacility
            : existingFacility && existingFacility.toUpperCase() !== 'OTHER'
            ? 'OTHER'
            : '',
          other_facility: !isKnownFacility && existingFacility && existingFacility.toUpperCase() !== 'OTHER'
            ? formatCollegeName(existingFacility, true)
            : '',
          mobile: (profile.mobile || '').replace(/\D/g, '').slice(-10),
        })
      }
      setInitLoading(false)
    }

    loadUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated. Please login again.')

      const formattedFullName = formatPersonName(formData.full_name, true)

      // 1. Validate Participant Name
      if (!formattedFullName || formattedFullName.length < 2) {
        throw new Error('Please enter the Name of Participant (प्रतिभागी का नाम दर्ज करना अनिवार्य है).')
      }

      // 2. Validate Designation
      if (!formData.designation || formData.designation.trim() === '') {
        throw new Error('Please select your Designation / पदनाम (पदनाम चुनना अनिवार्य है).')
      }

      let selectedDesignation = ''
      if (formData.designation === 'OTHER') {
        const typedDesig = formData.other_designation.trim()
        if (!typedDesig || typedDesig.length < 2) {
          throw new Error('Please specify your Designation (अपना पदनाम टाइप करना अनिवार्य है, उदा. GNM / Staff Nurse in-charge).')
        }
        selectedDesignation = typedDesig
      } else {
        selectedDesignation = formData.designation.trim()
      }

      // 3. Validate Health Facility
      if (!formData.health_facility || formData.health_facility.trim() === '') {
        throw new Error('Please select your Health Facility (स्वास्थ्य सुविधा का चयन करना अनिवार्य है).')
      }

      let selectedFacility = ''
      if (formData.health_facility === 'OTHER') {
        const typedFacility = formData.other_facility.trim()
        if (!typedFacility || typedFacility.length < 2) {
          throw new Error('Please type your Health Facility Name (स्वास्थ्य सुविधा का नाम टाइप करना अनिवार्य है).')
        }
        if (typedFacility.toUpperCase() === 'OTHER') {
          throw new Error('Please type the actual Health Facility Name, not the word "OTHER".')
        }
        selectedFacility = formatCollegeName(typedFacility, true)
      } else {
        selectedFacility = formData.health_facility.trim()
      }

      if (!selectedFacility || selectedFacility.toUpperCase() === 'OTHER') {
        throw new Error('Please specify a valid Health Facility Name.')
      }

      // 4. Validate Mobile Number (Strict 10 digits)
      const cleanMobile = formData.mobile.replace(/\D/g, '')
      if (!/^\d{10}$/.test(cleanMobile)) {
        throw new Error('Please enter a valid 10-digit mobile number (10 अंकों का मान्य मोबाइल नंबर दर्ज करना अनिवार्य है).')
      }

      // Check existing profile to preserve existing registration number
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('registration_number')
        .eq('id', user.id)
        .single()

      const regNum = existingProfile?.registration_number || `AMR-WAAW-2026-${Math.floor(100000 + Math.random() * 900000)}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formattedFullName,
          college_name: selectedFacility,
          course: selectedDesignation,
          year_semester: 'NMC Nagpur',
          mobile: cleanMobile,
          registration_number: regNum,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem('auth_redirect_target') || localStorage.getItem('auth_redirect_target') : null
      const target = (search && search.startsWith('/')) ? search : (saved && saved.startsWith('/') ? saved : '/dashboard')
      router.push(target)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="AMR 2026 Logo"
              width={64}
              height={64}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Participant Registration</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 px-2">
            Enter your details to participate in the Online Quiz Competition for Pharmacy Officers &amp; Health Facility Staff.
          </p>
          <p className="text-[11px] font-semibold text-red-600 mt-1">
            * All fields are strictly compulsory (सभी विवरण भरना अनिवार्य है).
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-gray-100 p-5 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Name of Participant */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name of Participant / प्रतिभागी का नाम <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: formatPersonName(e.target.value, false) })
                  }
                  onBlur={() =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: formatPersonName(prev.full_name, true),
                    }))
                  }
                  placeholder="e.g. Harsh Wardhan Chandel"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900"
                />
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-[11px] text-amber-800 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Important:</strong> Please ensure your full official name is spelled correctly as it will appear on your Certificate.
                </span>
              </div>
            </div>

            {/* 2. Designation / पदनाम */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Designation / पदनाम <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  required
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      designation: e.target.value,
                      other_designation: e.target.value === 'OTHER' ? formData.other_designation : '',
                    })
                  }
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-white"
                >
                  <option value="" disabled>
                    -- Select Designation / पदनाम चुनें * --
                  </option>
                  <option value="Pharmacy Officer">Pharmacy Officer</option>
                  <option value="OTHER">Other (Specify Designation)</option>
                </select>
              </div>

              {formData.designation === 'OTHER' && (
                <div className="mt-2.5 space-y-1">
                  <label className="block text-[11px] font-semibold text-amber-900">
                    Specify Your Designation / अपना पदनाम लिखें <span className="text-red-500">* (Compulsory)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.other_designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_designation: e.target.value,
                      })
                    }
                    placeholder="Enter Designation (e.g. GNM Staff Nurse In-charge)"
                    className="block w-full px-3 py-2.5 rounded-lg border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-amber-50/30 text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    उदा. GNM Staff Nurse (In-charge Pharmacy Officer), Medical Officer, आदि।
                  </p>
                </div>
              )}
            </div>

            {/* 3. Name of Health Facility */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name of Health Facility / स्वास्थ्य सुविधा का नाम <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  required
                  value={formData.health_facility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_facility: e.target.value,
                      other_facility: e.target.value === 'OTHER' ? formData.other_facility : '',
                    })
                  }
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-white"
                >
                  <option value="" disabled>
                    -- Select Your NMC Health Facility (UPHC) * --
                  </option>
                  {HEALTH_FACILITIES.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                  <option value="OTHER">Other (Specify Health Facility)</option>
                </select>
              </div>

              {formData.health_facility === 'OTHER' && (
                <div className="mt-2.5 space-y-1">
                  <label className="block text-[11px] font-semibold text-amber-900">
                    Type Your Health Facility Name / स्वास्थ्य सुविधा का नाम लिखें <span className="text-red-500">* (Compulsory)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={formData.other_facility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_facility: formatCollegeName(e.target.value, false),
                      })
                    }
                    onBlur={() =>
                      setFormData((prev) => ({
                        ...prev,
                        other_facility: formatCollegeName(prev.other_facility, true),
                      }))
                    }
                    placeholder="Enter Health Facility Name (e.g. Indira Gandhi Rugnalaya, Sadar)"
                    className="block w-full px-3 py-2.5 rounded-lg border border-amber-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 bg-amber-50/30 text-sm font-medium"
                  />
                  <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                    <span>⚠️ &apos;Other&apos; चुनने पर स्वास्थ्य सुविधा का पूरा नाम टाइप करना अनिवार्य है।</span>
                  </div>
                </div>
              )}

              <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-[11px] text-amber-800 leading-snug">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Important:</strong> Your selected Health Facility will appear on your official results, leaderboards &amp; reports.
                </span>
              </div>
            </div>

            {/* 4. 10-Digit Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Mobile Number / मोबाइल नंबर (10 Digits) <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    formData.mobile.length === 10 ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {formData.mobile.length}/10
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  required
                  value={formData.mobile}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setFormData({ ...formData, mobile: digitsOnly })
                  }}
                  placeholder="Enter 10-digit mobile number"
                  title="Please enter a valid 10-digit mobile number"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-gray-900 tracking-wide font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 mt-6 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Submitting Details...' : 'Complete Registration & Continue'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
