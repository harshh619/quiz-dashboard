const { Client } = require('pg');

const client = new Client({
  host: 'db.ulrrjbsjcssxwdjivrzc.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'cX0g8umNdaSCSLC5',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
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

  -- Validate timing: allow a 5-second leeway to eliminate client-server clock jitter
  IF v_now < (v_comp.scheduled_start - INTERVAL '5 seconds') THEN
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
  IF v_time_remaining > v_comp.duration_seconds THEN
    v_time_remaining := v_comp.duration_seconds;
  END IF;

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
        'display_order', r.display_order,
        'selected_option', r.selected_option
      ) ORDER BY r.display_order
    ) INTO v_questions_json
    FROM quiz_responses r
    JOIN question_bank q ON q.id = r.question_id
    WHERE r.attempt_id = v_attempt.id;

    RETURN jsonb_build_object(
      'success', true,
      'attempt_id', v_attempt.id,
      'status', 'resumed',
      'time_remaining_seconds', v_time_remaining,
      'total_questions', v_comp.total_questions,
      'questions', COALESCE(v_questions_json, '[]'::jsonb)
    );
  END IF;

  -- If not registered, auto-register student
  INSERT INTO registrations (competition_id, student_id)
  VALUES (p_competition_id, p_student_id)
  ON CONFLICT (competition_id, student_id) DO NOTHING;

  -- Create fresh quiz attempt
  INSERT INTO quiz_attempts (
    competition_id,
    student_id,
    started_at,
    total_questions,
    status
  )
  VALUES (
    p_competition_id,
    p_student_id,
    v_now,
    v_comp.total_questions,
    'in_progress'
  )
  RETURNING id INTO v_new_attempt_id;

  -- Insert questions with server-randomized display order
  FOR v_q IN (
    SELECT id FROM question_bank 
    ORDER BY random() 
    LIMIT v_comp.total_questions
  ) LOOP
    INSERT INTO quiz_responses (attempt_id, question_id, display_order)
    VALUES (v_new_attempt_id, v_q.id, v_order_counter);
    v_order_counter := v_order_counter + 1;
  END LOOP;

  -- Fetch newly created question set
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'question_text', q.question_text,
      'option_a', q.option_a,
      'option_b', q.option_b,
      'option_c', q.option_c,
      'option_d', q.option_d,
      'topic', q.topic,
      'display_order', r.display_order,
      'selected_option', NULL
    ) ORDER BY r.display_order
  ) INTO v_questions_json
  FROM quiz_responses r
  JOIN question_bank q ON q.id = r.question_id
  WHERE r.attempt_id = v_new_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_new_attempt_id,
    'status', 'started',
    'time_remaining_seconds', v_time_remaining,
    'total_questions', v_comp.total_questions,
    'questions', COALESCE(v_questions_json, '[]'::jsonb)
  );
END;
$$;
`;

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL.');
  await client.query(sql);
  console.log('✓ Successfully updated start_or_resume_quiz_attempt RPC with 5s clock-skew leeway!');
  await client.end();
}

main().catch(err => {
  console.error('Error applying RPC:', err);
  process.exit(1);
});
