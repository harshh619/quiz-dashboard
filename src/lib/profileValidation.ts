// ============================================
// AMR Quiz Portal - Profile Completion Validator
// ============================================

export interface PartialProfile {
  full_name?: string | null
  college_name?: string | null
  course?: string | null
  mobile?: string | null
  profile_completed?: boolean | null
  role?: string | null
}

/**
 * Returns true only if all compulsory registration fields are present, valid, and non-empty:
 * 1. Full name is non-empty.
 * 2. Name of Health Facility (college_name) is non-empty and not the literal word 'OTHER'.
 * 3. Designation (course) is non-empty and not 'OTHER'.
 * 4. Mobile number is exactly 10 digits.
 * 5. profile_completed is true.
 */
export function isProfileComplete(profile: PartialProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true

  const fullName = (profile.full_name || '').trim()
  const facility = (profile.college_name || '').trim()
  const designation = (profile.course || '').trim()
  const mobile = (profile.mobile || '').replace(/\D/g, '')
  const completed = Boolean(profile.profile_completed)

  if (!fullName) return false
  if (!facility || facility.toUpperCase() === 'OTHER') return false
  if (!designation || designation.toUpperCase() === 'OTHER') return false
  if (!/^\d{10}$/.test(mobile)) return false
  if (!completed) return false

  return true
}
