// ============================================
// AMR Quiz Portal - App Constants
// ============================================

export const APP_NAME = 'AMR Quiz Portal'
export const APP_TAGLINE = 'World AMR Awareness Week – Online Quiz Competition'

export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 32,
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

export const HEALTH_FACILITIES = [
  'AYUSH UPHC',
  'Babulban UPHC',
  'Babulkheda UPHC',
  'Bande Nawaj Azad Nagar UPHC',
  'Bhaldarpura UPHC',
  'Bhandewadi UPHC',
  'Bidipeth UPHC',
  'Binaki UPHC',
  'Chinchbhavan UPHC',
  'Cotton Market UPHC',
  'Dabha UPHC',
  'Dick UPHC',
  'Dighori UPHC',
  'Dipti Signal UPHC',
  'Futala UPHC',
  'Garib Nagar UPHC',
  'Gorewada UPHC',
  'Hansapuri UPHC',
  'Hazaripahad UPHC',
  'Hiwri Nagar UPHC',
  'Hudkeshwar UPHC',
  'Indira Gandhi Rugnalaya',
  'Indora UPHC',
  'Jagnath Budhwari UPHC',
  'Jaitala UPHC',
  'K.T. Nagar UPHC',
  'Kapil Nagar UPHC',
  'Khamla UPHC',
  'Kundanlal Gupta UPHC',
  'Mahal Lakdipul UPHC',
  'Manewada UPHC',
  'Mehandibag UPHC',
  'Mominpura UPHC',
  'Nandanvan UPHC',
  'Nara UPHC',
  'Narendra Nagar UPHC',
  'Narsala UPHC',
  'Netaji UPHC',
  'Pachpaoli UPHC',
  'Pachpaoli Maternity Hospital',
  'Pardi UPHC',
  'Sachidanand UPHC',
  'Satrangipura UPHC',
  'Shanti Nagar UPHC',
  'Shende Nagar UPHC',
  'Somalwada UPHC',
  'Somwari Quarter UPHC',
  'Sonegaon UPHC',
  'Tajbag UPHC',
  'Telangkhedi UPHC',
  'Vaishnodevinagar-Kalamna UPHC',
  'Vijay Nagar (Bharatwada) UPHC',
  'Zingabai Takli UPHC',
] as const

export const COURSE_GROUPS = [
  {
    label: 'Pharmacy Courses',
    options: [
      'B.Pharm',
      'D.Pharm',
      'M.Pharm',
      'Pharm.D',
      'Ph.D (Pharmacy)',
    ],
  },
  {
    label: 'Microbiology & Life Sciences',
    options: [
      'B.Sc (Microbiology)',
      'M.Sc (Microbiology)',
      'M.Sc (Medical Microbiology)',
      'B.Sc (Biotechnology / Life Sciences)',
      'M.Sc (Biotechnology / Life Sciences)',
      'B.Sc MLT / DMLT',
      'Ph.D (Microbiology)',
    ],
  },
  {
    label: 'Other Health Sciences',
    options: ['Other'],
  },
] as const

export const COURSES = [
  'B.Pharm',
  'D.Pharm',
  'M.Pharm',
  'Pharm.D',
  'Ph.D (Pharmacy)',
  'B.Sc (Microbiology)',
  'M.Sc (Microbiology)',
  'M.Sc (Medical Microbiology)',
  'B.Sc (Biotechnology / Life Sciences)',
  'M.Sc (Biotechnology / Life Sciences)',
  'B.Sc MLT / DMLT',
  'Ph.D (Microbiology)',
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
