-- ============================================================
-- AMR Quiz Portal - Full Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  college_name TEXT NOT NULL DEFAULT '',
  course TEXT NOT NULL DEFAULT '',
  year_semester TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  registration_number TEXT UNIQUE,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. COMPETITIONS
-- ============================================================
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','waiting_room','active','closed','results_published')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 600,
  total_questions INTEGER NOT NULL DEFAULT 30,
  passing_score INTEGER NOT NULL DEFAULT 18,
  max_participants INTEGER NOT NULL DEFAULT 1000,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_schedule CHECK (scheduled_end > scheduled_start)
);

-- ============================================================
-- 3. REGISTRATIONS (one per student per competition)
-- ============================================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, student_id)  -- One registration per student
);

-- ============================================================
-- 4. QUESTION BANK
-- ============================================================
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  explanation TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'AMR General',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. COMPETITION QUESTIONS (selected 30 questions for a quiz)
-- ============================================================
CREATE TABLE competition_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  UNIQUE (competition_id, question_id),
  UNIQUE (competition_id, display_order)
);

-- ============================================================
-- 6. QUIZ ATTEMPTS (one per student per competition - enforced)
-- ============================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','submitted','timed_out')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  total_questions INTEGER NOT NULL DEFAULT 30,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, student_id)  -- ONE attempt per student
);

-- ============================================================
-- 7. ATTEMPT QUESTIONS (randomized order per student)
-- ============================================================
CREATE TABLE attempt_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  option_order JSONB NOT NULL DEFAULT '["A","B","C","D"]'::JSONB,
  UNIQUE (attempt_id, question_id),
  UNIQUE (attempt_id, display_order)
);

-- ============================================================
-- 8. QUIZ RESPONSES (autosaved answers - NO correct_option here)
-- ============================================================
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  selected_option CHAR(1) CHECK (selected_option IN ('A','B','C','D')),
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

-- ============================================================
-- 9. COMPETITION RESULTS (finalized leaderboard)
-- ============================================================
CREATE TABLE competition_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_type TEXT NOT NULL DEFAULT 'participation'
    CHECK (certificate_type IN ('first_prize','second_prize','third_prize','participation')),
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, student_id)
);

-- ============================================================
-- 10. CERTIFICATE SIGNATORIES (3 per competition)
-- ============================================================
CREATE TABLE certificate_signatories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  signature_path TEXT,  -- Supabase Storage path
  display_order INTEGER NOT NULL CHECK (display_order IN (1,2,3)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, display_order)
);

-- ============================================================
-- 11. CERTIFICATES (issued certificates)
-- ============================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL
    CHECK (certificate_type IN ('first_prize','second_prize','third_prize','participation')),
  certificate_number TEXT NOT NULL UNIQUE,  -- AMR-WAAW-2026-000001
  pdf_path TEXT,  -- Supabase Storage path
  qr_verification_url TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id)
);

-- ============================================================
-- 12. EMAIL JOBS (background email queue)
-- ============================================================
CREATE TABLE email_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL
    CHECK (type IN ('certificate','result_notification','registration_confirmation')),
  to_email TEXT NOT NULL,
  to_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_registrations_competition ON registrations(competition_id);
CREATE INDEX idx_registrations_student ON registrations(student_id);
CREATE INDEX idx_quiz_attempts_competition ON quiz_attempts(competition_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_responses_attempt ON quiz_responses(attempt_id);
CREATE INDEX idx_attempt_questions_attempt ON attempt_questions(attempt_id);
CREATE INDEX idx_competition_results_competition ON competition_results(competition_id);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_email_jobs_status ON email_jobs(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- COMPETITIONS policies
CREATE POLICY "Anyone can view active competitions" ON competitions FOR SELECT
  USING (status IN ('waiting_room','active','closed','results_published'));
CREATE POLICY "Admins can manage competitions" ON competitions FOR ALL USING (is_admin());

-- REGISTRATIONS policies
CREATE POLICY "Students can register themselves" ON registrations FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own registration" ON registrations FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Admins can view all registrations" ON registrations FOR SELECT USING (is_admin());

-- QUESTION BANK policies (never expose correct_option to students directly)
CREATE POLICY "Admins can manage question bank" ON question_bank FOR ALL USING (is_admin());
-- Students get questions via RPC function only (which strips correct_option)

-- COMPETITION QUESTIONS policies
CREATE POLICY "Admins can manage competition questions" ON competition_questions FOR ALL USING (is_admin());
CREATE POLICY "Students can view competition questions list" ON competition_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND status IN ('active','closed','results_published')));

-- QUIZ ATTEMPTS policies
CREATE POLICY "Students can view own attempt" ON quiz_attempts FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Admins can view all attempts" ON quiz_attempts FOR SELECT USING (is_admin());

-- ATTEMPT QUESTIONS policies
CREATE POLICY "Students can view own attempt questions" ON attempt_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid()));

-- QUIZ RESPONSES policies
CREATE POLICY "Students can manage own responses" ON quiz_responses FOR ALL
  USING (EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND student_id = auth.uid()));
CREATE POLICY "Admins can view all responses" ON quiz_responses FOR SELECT USING (is_admin());

-- COMPETITION RESULTS policies
CREATE POLICY "Anyone can view published results" ON competition_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM competitions WHERE id = competition_id AND status = 'results_published'));
CREATE POLICY "Admins can manage results" ON competition_results FOR ALL USING (is_admin());

-- CERTIFICATES policies
CREATE POLICY "Students can view own certificate" ON certificates FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Anyone can verify certificate by number" ON certificates FOR SELECT
  USING (TRUE);  -- Public verification page needs this
CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL USING (is_admin());

-- EMAIL JOBS policies (admin only)
CREATE POLICY "Admins can manage email jobs" ON email_jobs FOR ALL USING (is_admin());

-- AUDIT LOGS policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (is_admin());
