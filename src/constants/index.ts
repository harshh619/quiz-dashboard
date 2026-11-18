// ============================================
// AMR Quiz Portal - App Constants
// ============================================

export const APP_NAME = 'AMR Quiz Portal'
export const APP_TAGLINE = 'World AMR Awareness Week – Online Quiz Competition'

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 30,
  DURATION_SECONDS: 600,       // 10 minutes
  WAITING_ROOM_OPEN_MINS: 15,  // Open 15 mins before quiz
  MAX_PARTICIPANTS: 1000,
} as const

export const COMPETITION_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  WAITING_ROOM: 'waiting_room',
  ACTIVE: 'active',
  CLOSED: 'closed',
  RESULTS_PUBLISHED: 'results_published',
} as const

export const CERTIFICATE_TYPES = {
  FIRST_PRIZE: 'first_prize',
  SECOND_PRIZE: 'second_prize',
  THIRD_PRIZE: 'third_prize',
  PARTICIPATION: 'participation',
} as const

export const CERTIFICATE_LABELS = {
  first_prize: 'First Prize',
  second_prize: 'Second Prize',
  third_prize: 'Third Prize',
  participation: 'Participation Certificate',
} as const

export const COURSES = [
  'B.Pharm',
  'D.Pharm',
  'Pharm.D',
  'Other',
] as const

export const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  '6th Year / Internship',
] as const

export const ACADEMIC_SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  '3rd Semester',
  '4th Semester',
  '5th Semester',
  '6th Semester',
  '7th Semester',
  '8th Semester',
  'Not Applicable (Annual)',
] as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  STUDENT_DASHBOARD: '/dashboard',
  WAITING_ROOM: (id: string) => `/waiting-room/${id}`,
  QUIZ: (id: string) => `/quiz/${id}`,
  RESULT: (id: string) => `/result/${id}`,
  VERIFY: (code: string) => `/verify/${code}`,
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_COMPETITIONS: '/admin/competitions',
  ADMIN_RESULTS: '/admin/results',
  ADMIN_CERTIFICATES: '/admin/certificates',
  ADMIN_EMAILS: '/admin/emails',
} as const

// Supabase Storage bucket names
export const STORAGE_BUCKETS = {
  CERTIFICATES: 'certificates',
  SIGNATURES: 'signatures',
} as const
