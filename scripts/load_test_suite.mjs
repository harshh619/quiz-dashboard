import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)
// Anon client with user tokens can also be tested, but admin or user client calls RPC similarly
const client = createClient(supabaseUrl, anonKey)

const TEST_COMP_ID = 'e9999999-9999-9999-9999-999999999999'

function stats(durations) {
  if (durations.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 }
  durations.sort((a, b) => a - b)
  const sum = durations.reduce((a, b) => a + b, 0)
  const avg = Math.round(sum / durations.length)
  const min = durations[0]
  const max = durations[durations.length - 1]
  const p95 = durations[Math.floor(durations.length * 0.95)] || max
  return { min, max, avg, p95 }
}

async function setupTestCompetition() {
  console.log('\n--- 1. Setting up temporary test competition ---')
  const now = new Date()
  const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()

  // Clean old test competition if exists
  await admin.from('competitions').delete().eq('id', TEST_COMP_ID)

  const { data: comp, error: cErr } = await admin.from('competitions').insert({
    id: TEST_COMP_ID,
    title: 'LOAD TESTING BENCHMARK COMPETITION (TEMPORARY)',
    description: 'Isolated sandbox for concurrency testing.',
    status: 'active',
    scheduled_start: start,
    scheduled_end: end,
    duration_seconds: 600,
    total_questions: 30,
    passing_score: 18,
    max_participants: 2000,
  }).select('*').single()

  if (cErr) {
    throw new Error('Failed to create test competition: ' + JSON.stringify(cErr))
  }

  // Fetch 30 questions from question_bank
  const { data: questions, error: qErr } = await admin
    .from('question_bank')
    .select('id')
    .limit(30)

  if (qErr || !questions || questions.length === 0) {
    throw new Error('No questions found in question_bank: ' + JSON.stringify(qErr))
  }

  const links = questions.map((q, idx) => ({
    competition_id: TEST_COMP_ID,
    question_id: q.id,
    display_order: idx + 1,
  }))

  const { error: lErr } = await admin.from('competition_questions').insert(links)
  if (lErr) {
    throw new Error('Failed to link questions: ' + JSON.stringify(lErr))
  }

  console.log(`✓ Test competition ready with ${questions.length} questions.`)
  return questions.map(q => q.id)
}

async function createTestUsers(count) {
  console.log(`\n--- 2. Creating pool of ${count} test participants ---`)
  const users = []
  const batchSize = 10
  for (let i = 0; i < count; i += batchSize) {
    const chunk = []
    const end = Math.min(i + batchSize, count)
    for (let j = i; j < end; j++) {
      const email = `loadtest_user_${Date.now()}_${j}@amrloadtest.internal`
      chunk.push(admin.auth.admin.createUser({
        email,
        password: 'Password123!SafeLoadTest',
        email_confirm: true,
        user_metadata: {
          full_name: `LoadTest Participant ${j + 1}`,
          college_name: `Test Facility ${(j % 5) + 1}`,
          role: 'student'
        }
      }))
    }
    const results = await Promise.all(chunk)
    for (const res of results) {
      if (res.data?.user) {
        users.push(res.data.user)
      } else {
        console.error('Error creating user:', res.error)
      }
    }
    process.stdout.write(` Created ${users.length}/${count} users...\r`)
  }
  console.log(`\n✓ Successfully created ${users.length} test participants.`)
  return users
}

async function runSimultaneousStarts(usersSubset, waveLabel) {
  console.log(`\n=== Wave: ${waveLabel} (${usersSubset.length} Simultaneous Starts) ===`)
  const startTime = Date.now()

  const promises = usersSubset.map(async (u) => {
    const reqStart = Date.now()
    try {
      const { data, error } = await admin.rpc('start_or_resume_quiz_attempt', {
        p_competition_id: TEST_COMP_ID,
        p_student_id: u.id,
      })
      const duration = Date.now() - reqStart
      if (error) return { success: false, duration, error: error.message }
      if (!data?.success) return { success: false, duration, error: data?.error || 'Unknown failure' }
      return { success: true, duration, attemptId: data.attempt_id, questionCount: data.questions?.length }
    } catch (err) {
      return { success: false, duration: Date.now() - reqStart, error: err.message }
    }
  })

  const results = await Promise.all(promises)
  const totalWallTime = Date.now() - startTime

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const durations = results.map(r => r.duration)
  const st = stats(durations)

  console.log(`Results for ${waveLabel}:`)
  console.log(`  - Total Requests:      ${results.length}`)
  console.log(`  - Successful:          ${successful.length} (${((successful.length/results.length)*100).toFixed(1)}%)`)
  console.log(`  - Failed:              ${failed.length}`)
  if (failed.length > 0) {
    console.log(`  - Sample Error:        ${failed[0].error}`)
  }
  console.log(`  - Wall Clock Time:     ${totalWallTime} ms`)
  console.log(`  - Throughput (RPS):    ${((results.length / totalWallTime) * 1000).toFixed(1)} req/s`)
  console.log(`  - Avg Response Time:   ${st.avg} ms`)
  console.log(`  - Min Response Time:   ${st.min} ms`)
  console.log(`  - Max Response Time:   ${st.max} ms`)
  console.log(`  - P95 Response Time:   ${st.p95} ms`)

  return { results, st, totalWallTime, successful: successful.length, failed: failed.length }
}

async function runSimultaneousAutosaves(attempts, questionIds, waveLabel) {
  console.log(`\n=== Wave: ${waveLabel} (${attempts.length} Simultaneous Autosaves) ===`)
  const startTime = Date.now()

  const options = ['A', 'B', 'C', 'D']
  const promises = attempts.map(async (att, idx) => {
    const qId = questionIds[idx % questionIds.length]
    const opt = options[idx % 4]
    const reqStart = Date.now()
    try {
      const { data, error } = await admin.rpc('autosave_quiz_response', {
        p_attempt_id: att.attemptId,
        p_student_id: att.studentId,
        p_question_id: qId,
        p_selected_option: opt,
      })
      const duration = Date.now() - reqStart
      if (error) return { success: false, duration, error: error.message }
      return { success: true, duration }
    } catch (err) {
      return { success: false, duration: Date.now() - reqStart, error: err.message }
    }
  })

  const results = await Promise.all(promises)
  const totalWallTime = Date.now() - startTime

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const durations = results.map(r => r.duration)
  const st = stats(durations)

  console.log(`Results for ${waveLabel}:`)
  console.log(`  - Total Requests:      ${results.length}`)
  console.log(`  - Successful:          ${successful.length}`)
  console.log(`  - Failed:              ${failed.length}`)
  console.log(`  - Wall Clock Time:     ${totalWallTime} ms`)
  console.log(`  - Throughput (RPS):    ${((results.length / totalWallTime) * 1000).toFixed(1)} req/s`)
  console.log(`  - Avg Response Time:   ${st.avg} ms`)
  console.log(`  - P95 Response Time:   ${st.p95} ms`)

  return { st, totalWallTime }
}

async function runSimultaneousSubmits(attempts, waveLabel) {
  console.log(`\n=== Wave: ${waveLabel} (${attempts.length} Simultaneous Submissions) ===`)
  const startTime = Date.now()

  const promises = attempts.map(async (att) => {
    const reqStart = Date.now()
    try {
      const { data, error } = await admin.rpc('submit_quiz_attempt', {
        p_attempt_id: att.attemptId,
        p_student_id: att.studentId,
      })
      const duration = Date.now() - reqStart
      if (error) return { success: false, duration, error: error.message }
      if (!data?.success) return { success: false, duration, error: data?.error }
      return { success: true, duration, score: data.score }
    } catch (err) {
      return { success: false, duration: Date.now() - reqStart, error: err.message }
    }
  })

  const results = await Promise.all(promises)
  const totalWallTime = Date.now() - startTime

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const durations = results.map(r => r.duration)
  const st = stats(durations)

  console.log(`Results for ${waveLabel}:`)
  console.log(`  - Total Requests:      ${results.length}`)
  console.log(`  - Successful:          ${successful.length}`)
  console.log(`  - Failed:              ${failed.length}`)
  console.log(`  - Wall Clock Time:     ${totalWallTime} ms`)
  console.log(`  - Throughput (RPS):    ${((results.length / totalWallTime) * 1000).toFixed(1)} req/s`)
  console.log(`  - Avg Response Time:   ${st.avg} ms`)
  console.log(`  - P95 Response Time:   ${st.p95} ms`)

  return { st, totalWallTime }
}

async function cleanup(users) {
  console.log('\n--- Cleaning up temporary test data ---')
  // 1. Delete test competition (cascades to quiz_attempts, attempt_questions, responses)
  await admin.from('competitions').delete().eq('id', TEST_COMP_ID)
  console.log('✓ Cleaned up test competition & attempts')

  // 2. Delete test users
  const batchSize = 10
  for (let i = 0; i < users.length; i += batchSize) {
    const chunk = users.slice(i, i + batchSize)
    await Promise.all(chunk.map(u => admin.auth.admin.deleteUser(u.id)))
    process.stdout.write(` Deleted ${Math.min(i + batchSize, users.length)}/${users.length} users...\r`)
  }
  console.log(`\n✓ Cleaned up all ${users.length} test users. Database is pristine.`)
}

async function run() {
  console.log('===============================================================')
  console.log('   AMR QUIZ PORTAL - REAL CONCURRENCY & LOAD BENCHMARK')
  console.log('===============================================================')

  let questionIds = []
  let users = []
  try {
    questionIds = await setupTestCompetition()
    users = await createTestUsers(50)

    // Wave 1: 10 concurrent starts
    const wave10 = await runSimultaneousStarts(users.slice(0, 10), '10 Concurrent Starts')

    // Clean attempts from wave 10 to allow re-start or use second competition, or clean attempts for this comp
    await admin.from('quiz_attempts').delete().eq('competition_id', TEST_COMP_ID)

    // Wave 2: 25 concurrent starts
    const wave25 = await runSimultaneousStarts(users.slice(0, 25), '25 Concurrent Starts')

    await admin.from('quiz_attempts').delete().eq('competition_id', TEST_COMP_ID)

    // Wave 3: 50 concurrent starts
    const wave50 = await runSimultaneousStarts(users, '50 Concurrent Starts (Peak Burst)')

    // Extract attempt IDs
    const attempts = wave50.results
      .filter(r => r.success && r.attemptId)
      .map((r, i) => ({ attemptId: r.attemptId, studentId: users[i].id }))

    // Wave 4: 50 concurrent autosaves
    await runSimultaneousAutosaves(attempts, questionIds, '50 Concurrent Autosaves')

    // Wave 5: 50 concurrent submits
    await runSimultaneousSubmits(attempts, '50 Concurrent Submissions')

  } catch (err) {
    console.error('Test Suite encountered error:', err)
  } finally {
    if (users.length > 0) {
      await cleanup(users)
    }
  }
}

run()
