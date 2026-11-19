-- ============================================================
-- AMR Quiz Portal - RPC Functions for Quiz Engine & Ranking
-- Migration: 002_quiz_rpc_functions.sql
-- ============================================================

-- Function 1: Register Student for Competition
CREATE OR REPLACE FUNCTION register_student_for_competition(
  p_competition_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp RECORD;
  v_existing_reg UUID;
  v_reg_count INT;
  v_reg_id UUID;
BEGIN
  -- Verify competition exists and registration is permitted
  SELECT * INTO v_comp FROM competitions WHERE id = p_competition_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
  END IF;

  IF v_comp.status NOT IN ('draft', 'scheduled', 'waiting_room', 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration is closed for this competition');
  END IF;

  -- Check already registered
  SELECT id INTO v_existing_reg FROM registrations 
  WHERE competition_id = p_competition_id AND student_id = p_student_id;
  
  IF v_existing_reg IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already registered', 'registration_id', v_existing_reg);
  END IF;

  -- Check max participant limit
  SELECT count(*) INTO v_reg_count FROM registrations WHERE competition_id = p_competition_id;
  IF v_reg_count >= v_comp.max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition registration is full');
  END IF;

  -- Insert registration
  INSERT INTO registrations (competition_id, student_id)
  VALUES (p_competition_id, p_student_id)
  RETURNING id INTO v_reg_id;

  RETURN jsonb_build_object('success', true, 'registration_id', v_reg_id);
END;
$$;


-- Function 2: Start or Resume Quiz Attempt (Server-Controlled & Randomized)
CREATE OR REPLACE FUNCTION start_or_resume_quiz_attempt(
  p_competition_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp RECORD;
  v_attempt RECORD;
  v_existing_attempt_id UUID;
  v_new_attempt_id UUID;
  v_q RECORD;
  v_order_counter INT := 1;
  v_questions_json JSONB;
  v_time_remaining INT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Check competition
  SELECT * INTO v_comp FROM competitions WHERE id = p_competition_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
  END IF;

  -- Validate timing: quiz must be active or waiting_room (if active or server time within window)
  IF v_now < v_comp.scheduled_start THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quiz has not started yet',
      'scheduled_start', v_comp.scheduled_start
    );
  END IF;

  IF v_now >= v_comp.scheduled_end THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz deadline has ended');
  END IF;

  -- Calculate server remaining seconds
  v_time_remaining := EXTRACT(EPOCH FROM (v_comp.scheduled_end - v_now))::INT;

  -- Check if attempt already exists
  SELECT * INTO v_attempt FROM quiz_attempts 
  WHERE competition_id = p_competition_id AND student_id = p_student_id;

  IF FOUND THEN
    -- If already submitted or timed out
    IF v_attempt.status IN ('submitted', 'timed_out') THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Quiz attempt already completed',
        'status', v_attempt.status,
        'attempt_id', v_attempt.id
      );
    END IF;

    -- Return existing attempt questions & current responses
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'question_text', q.question_text,
        'option_a', q.option_a,
        'option_b', q.option_b,
        'option_c', q.option_c,
        'option_d', q.option_d,
        'topic', q.topic,
        'display_order', aq.display_order,
        'option_order', aq.option_order,
        'selected_option', qr.selected_option
      ) ORDER BY aq.display_order ASC
    ) INTO v_questions_json
    FROM attempt_questions aq
    JOIN question_bank q ON q.id = aq.question_id
    LEFT JOIN quiz_responses qr ON qr.attempt_id = v_attempt.id AND qr.question_id = q.id
    WHERE aq.attempt_id = v_attempt.id;

    RETURN jsonb_build_object(
      'success', true,
      'resumed', true,
      'attempt_id', v_attempt.id,
      'time_remaining_seconds', v_time_remaining,
      'questions', v_questions_json
    );
  END IF;

  -- Create new attempt
  INSERT INTO quiz_attempts (
    competition_id,
    student_id,
    status,
    started_at,
    total_questions
  )
  VALUES (
    p_competition_id,
    p_student_id,
    'in_progress',
    v_now,
    v_comp.total_questions
  )
  RETURNING id INTO v_new_attempt_id;

  -- Assign and randomize questions for this student
  FOR v_q IN (
    SELECT q.id
    FROM competition_questions cq
    JOIN question_bank q ON q.id = cq.question_id
    WHERE cq.competition_id = p_competition_id
    ORDER BY random()
  ) LOOP
    INSERT INTO attempt_questions (
      attempt_id,
      question_id,
      display_order,
      option_order
    )
    VALUES (
      v_new_attempt_id,
      v_q.id,
      v_order_counter,
      '["A","B","C","D"]'::JSONB
    );
    v_order_counter := v_order_counter + 1;
  END LOOP;

  -- Build client-safe question list (NEVER return correct_option or explanation)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_text', q.question_text,
      'option_a', q.option_a,
      'option_b', q.option_b,
      'option_c', q.option_c,
      'option_d', q.option_d,
      'topic', q.topic,
      'display_order', aq.display_order,
      'option_order', aq.option_order,
      'selected_option', null
    ) ORDER BY aq.display_order ASC
  ) INTO v_questions_json
  FROM attempt_questions aq
  JOIN question_bank q ON q.id = aq.question_id
  WHERE aq.attempt_id = v_new_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'resumed', false,
    'attempt_id', v_new_attempt_id,
    'time_remaining_seconds', v_time_remaining,
    'questions', v_questions_json
  );
END;
$$;


-- Function 3: Autosave Response (Debounced Server Call)
CREATE OR REPLACE FUNCTION autosave_quiz_response(
  p_attempt_id UUID,
  p_student_id UUID,
  p_question_id UUID,
  p_selected_option CHAR(1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_comp RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_total_score INT := 0;
BEGIN
  -- Validate attempt ownership and status
  SELECT a.*, c.scheduled_end INTO v_attempt
  FROM quiz_attempts a
  JOIN competitions c ON c.id = a.competition_id
  WHERE a.id = p_attempt_id AND a.student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid attempt');
  END IF;

  IF v_attempt.status != 'in_progress' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attempt already completed');
  END IF;

  -- If server deadline passed, mark timed out and immediately calculate score
  IF v_now > v_attempt.scheduled_end THEN
    SELECT 
      COALESCE(COUNT(*) FILTER (WHERE qr.selected_option = q.correct_option), 0)
    INTO v_total_score
    FROM attempt_questions aq
    JOIN question_bank q ON q.id = aq.question_id
    LEFT JOIN quiz_responses qr ON qr.attempt_id = aq.attempt_id AND qr.question_id = aq.question_id
    WHERE aq.attempt_id = p_attempt_id;

    UPDATE quiz_attempts 
    SET status = 'timed_out', submitted_at = v_now, score = v_total_score
    WHERE id = p_attempt_id;
    RETURN jsonb_build_object('success', false, 'error', 'Time has expired', 'score', v_total_score);
  END IF;

  -- Upsert answer
  INSERT INTO quiz_responses (attempt_id, question_id, selected_option, answered_at)
  VALUES (p_attempt_id, p_question_id, p_selected_option, v_now)
  ON CONFLICT (attempt_id, question_id)
  DO UPDATE SET
    selected_option = EXCLUDED.selected_option,
    answered_at = EXCLUDED.answered_at;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Function 4: Submit Quiz Attempt & Calculate Score Server-Side
CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_attempt_id UUID,
  p_student_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_comp RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_total_score INT := 0;
  v_total_correct INT := 0;
BEGIN
  -- Lock attempt row
  SELECT a.*, c.scheduled_end, c.duration_seconds INTO v_attempt
  FROM quiz_attempts a
  JOIN competitions c ON c.id = a.competition_id
  WHERE a.id = p_attempt_id AND a.student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attempt not found');
  END IF;

  IF v_attempt.status IN ('submitted', 'timed_out') THEN
    -- If score is null for any reason, calculate it now!
    IF v_attempt.score IS NULL THEN
      SELECT 
        COALESCE(COUNT(*) FILTER (WHERE qr.selected_option = q.correct_option), 0)
      INTO v_total_score
      FROM attempt_questions aq
      JOIN question_bank q ON q.id = aq.question_id
      LEFT JOIN quiz_responses qr ON qr.attempt_id = aq.attempt_id AND qr.question_id = aq.question_id
      WHERE aq.attempt_id = p_attempt_id;

      UPDATE quiz_attempts SET score = v_total_score WHERE id = p_attempt_id;
      v_attempt.score := v_total_score;
    END IF;

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Already submitted', 
      'score', v_attempt.score,
      'submitted_at', v_attempt.submitted_at
    );
  END IF;

  -- Calculate score securely from database
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE qr.selected_option = q.correct_option), 0)
  INTO v_total_score
  FROM attempt_questions aq
  JOIN question_bank q ON q.id = aq.question_id
  LEFT JOIN quiz_responses qr ON qr.attempt_id = aq.attempt_id AND qr.question_id = aq.question_id
  WHERE aq.attempt_id = p_attempt_id;

  -- Update attempt with score and status
  UPDATE quiz_attempts
  SET 
    status = CASE WHEN v_now > v_attempt.scheduled_end THEN 'timed_out' ELSE 'submitted' END,
    submitted_at = v_now,
    score = v_total_score
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'score', v_total_score,
    'total_questions', v_attempt.total_questions,
    'submitted_at', v_now
  );
END;
$$;


-- Function 5: Finalize Competition Leaderboard & Generate Certificates
CREATE OR REPLACE FUNCTION finalize_competition(
  p_competition_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_r RECORD;
  v_rank INT := 1;
  v_cert_type TEXT;
  v_cert_num TEXT;
  v_count INT := 0;
  v_app_url TEXT := 'http://localhost:3000';
BEGIN
  -- Verify competition exists
  UPDATE competitions 
  SET status = 'results_published', updated_at = NOW()
  WHERE id = p_competition_id;

  -- Clean previous results if re-finalized
  DELETE FROM competition_results WHERE competition_id = p_competition_id;

  -- Ensure any attempt with score IS NULL gets computed before ranking!
  UPDATE quiz_attempts a
  SET score = sub.calc_score
  FROM (
    SELECT aq.attempt_id, COALESCE(COUNT(*) FILTER (WHERE qr.selected_option = q.correct_option), 0) AS calc_score
    FROM attempt_questions aq
    JOIN question_bank q ON q.id = aq.question_id
    LEFT JOIN quiz_responses qr ON qr.attempt_id = aq.attempt_id AND qr.question_id = aq.question_id
    GROUP BY aq.attempt_id
  ) sub
  WHERE a.id = sub.attempt_id AND a.score IS NULL AND a.competition_id = p_competition_id;

  -- Loop through completed attempts ordered by score DESC, submitted_at ASC
  FOR v_r IN (
    SELECT 
      id AS attempt_id,
      student_id,
      score,
      submitted_at
    FROM quiz_attempts
    WHERE competition_id = p_competition_id 
      AND status IN ('submitted', 'timed_out')
      AND score IS NOT NULL
    ORDER BY score DESC, submitted_at ASC
  ) LOOP
    -- Assign certificate type and rank
    IF v_rank = 1 THEN
      v_cert_type := 'first_prize';
    ELSIF v_rank = 2 THEN
      v_cert_type := 'second_prize';
    ELSIF v_rank = 3 THEN
      v_cert_type := 'third_prize';
    ELSE
      v_cert_type := 'participation';
    END IF;

    -- Insert into competition_results
    INSERT INTO competition_results (
      competition_id,
      attempt_id,
      student_id,
      rank,
      score,
      submitted_at,
      is_winner,
      certificate_type
    )
    VALUES (
      p_competition_id,
      v_r.attempt_id,
      v_r.student_id,
      v_rank,
      v_r.score,
      COALESCE(v_r.submitted_at, NOW()),
      (v_rank <= 3),
      v_cert_type
    );

    -- Generate certificate number
    v_cert_num := 'AMR-WAAW-2026-' || LPAD(v_rank::TEXT, 6, '0');

    -- Insert certificate record
    INSERT INTO certificates (
      attempt_id,
      student_id,
      competition_id,
      certificate_type,
      certificate_number,
      qr_verification_url,
      issued_at
    )
    VALUES (
      v_r.attempt_id,
      v_r.student_id,
      p_competition_id,
      v_cert_type,
      v_cert_num,
      v_app_url || '/verify/' || v_cert_num,
      NOW()
    )
    ON CONFLICT (attempt_id) DO UPDATE SET
      certificate_type = EXCLUDED.certificate_type,
      certificate_number = EXCLUDED.certificate_number,
      qr_verification_url = EXCLUDED.qr_verification_url;

    -- Queue email job for certificate
    INSERT INTO email_jobs (
      type,
      to_email,
      to_name,
      subject,
      payload
    )
    SELECT 
      'certificate',
      p.email,
      p.full_name,
      'Congratulations! Your AMR Awareness Quiz Certificate is Ready',
      jsonb_build_object(
        'certificate_number', v_cert_num,
        'certificate_type', v_cert_type,
        'rank', v_rank,
        'score', v_r.score,
        'verification_url', v_app_url || '/verify/' || v_cert_num
      )
    FROM profiles p WHERE p.id = v_r.student_id;

    v_rank := v_rank + 1;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'total_finalized', v_count);
END;
$$;
