// ============================================
// AMR Quiz Portal - Type Definitions
// ============================================

export type UserRole = 'student' | 'admin'
export type CourseType = 'B.Pharm' | 'D.Pharm' | 'Pharm.D' | 'Other'
export type CompetitionStatus = 'draft' | 'scheduled' | 'waiting_room' | 'active' | 'closed' | 'results_published'
export type AttemptStatus = 'in_progress' | 'submitted' | 'timed_out'
export type CertificateType = 'first_prize' | 'second_prize' | 'third_prize' | 'participation'
export type EmailJobStatus = 'pending' | 'processing' | 'sent' | 'failed'

// --- Profile ---
export interface Profile {
  id: string
  email: string
  full_name: string
  college_name: string
  course: CourseType
  year_semester: string
  mobile: string
  role: UserRole
  registration_number: string
  created_at: string
}

// --- Competition ---
export interface Competition {
  id: string
  title: string
  description: string
  status: CompetitionStatus
  scheduled_start: string   // ISO timestamp
  scheduled_end: string     // ISO timestamp
  duration_seconds: number  // 600 = 10 minutes
  total_questions: number   // 30
  passing_score: number
  max_participants: number
  created_by: string
  created_at: string
}

// --- Registration ---
export interface Registration {
  id: string
  competition_id: string
  student_id: string
  registered_at: string
  profile?: Profile
}

// --- Question Bank ---
export interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  explanation: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

// --- Competition Questions (selected 30) ---
export interface CompetitionQuestion {
  id: string
  competition_id: string
  question_id: string
  display_order: number
  question?: Question
}

// --- Quiz Attempt ---
export interface QuizAttempt {
  id: string
  competition_id: string
  student_id: string
  status: AttemptStatus
  started_at: string
  submitted_at: string | null
  score: number | null
  total_questions: number
  rank: number | null
  created_at: string
}

// --- Attempt Questions (randomized per student) ---
export interface AttemptQuestion {
  id: string
  attempt_id: string
  question_id: string
  display_order: number
  option_order: string   // JSON: ["A","C","B","D"]
  question?: Question
}

// --- Quiz Response (autosaved) ---
export interface QuizResponse {
  id: string
  attempt_id: string
  question_id: string
  selected_option: 'A' | 'B' | 'C' | 'D' | null
  answered_at: string | null
}

// --- Certificate ---
export interface Certificate {
  id: string
  attempt_id: string
  student_id: string
  competition_id: string
  certificate_type: CertificateType
  certificate_number: string   // AMR-WAAW-2026-000001
  pdf_path: string | null
  qr_code_url: string
  issued_at: string
  student?: Profile
  competition?: Competition
}

// --- Certificate Signatories ---
export interface CertificateSignatory {
  id: string
  competition_id: string
  name: string
  designation: string
  signature_path: string   // Supabase Storage path
  display_order: number    // 1, 2, 3
}

// --- Competition Results (finalized leaderboard) ---
export interface CompetitionResult {
  id: string
  competition_id: string
  attempt_id: string
  student_id: string
  rank: number
  score: number
  submitted_at: string
  is_winner: boolean
  certificate_type: CertificateType
  student?: Profile
}

// --- Email Job ---
export interface EmailJob {
  id: string
  type: 'certificate' | 'result_notification' | 'registration_confirmation'
  to_email: string
  to_name: string
  subject: string
  payload: Record<string, unknown>
  status: EmailJobStatus
  attempts: number
  last_attempted_at: string | null
  error_message: string | null
  created_at: string
}

// --- Quiz State (client-side) ---
export interface QuizState {
  currentQuestionIndex: number
  responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>
  timeRemainingSeconds: number
  isSubmitting: boolean
  isSubmitted: boolean
}

// --- Client-safe Question (no correct_option) ---
export interface SafeQuestion {
  id: string
  question_text: string
  options: { key: string; text: string }[]  // Shuffled options
  topic: string
  display_order: number
}
