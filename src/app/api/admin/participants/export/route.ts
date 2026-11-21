import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { isProfileComplete } from '@/lib/profileValidation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCollegeName, formatPersonName } from '@/lib/textFormat'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin' || user.email === 'msunagpur@gmail.com') {
    return user
  }
  return null
}

function formatAwardLabel(certType?: string | null): string {
  switch (certType) {
    case 'first_prize':
      return 'First Prize (Merit)'
    case 'second_prize':
      return 'Second Prize (Merit)'
    case 'third_prize':
      return 'Third Prize (Merit)'
    case 'participation':
      return 'Participation Certificate'
    default:
      return '-'
  }
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })
}

function styleDataCellBorders(row: ExcelJS.Row, zebra: boolean) {
  row.height = 20
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { size: 10, color: { argb: 'FF0F172A' } }
    if (zebra) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }
    cell.alignment = { vertical: 'middle' }
  })
}

export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const admin = createAdminClient()

    const [
      { data: profiles, error: profErr },
      { data: attempts },
      { data: results },
      { data: certificates },
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .neq('email', 'msunagpur@gmail.com')
        .order('created_at', { ascending: false }),
      admin
        .from('quiz_attempts')
        .select('*')
        .order('created_at', { ascending: false }),
      admin
        .from('competition_results')
        .select('*')
        .order('rank', { ascending: true }),
      admin
        .from('certificates')
        .select('*')
        .order('issued_at', { ascending: false }),
    ])

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 })
    }

    const students = (profiles || []).filter((p) => isProfileComplete(p))

    // Build lookup maps keyed by student_id (latest attempt / best result / certificate)
    const attemptByStudent = new Map<string, any>()
    for (const a of attempts || []) {
      if (!attemptByStudent.has(a.student_id)) {
        attemptByStudent.set(a.student_id, a)
      }
    }

    const resultByStudent = new Map<string, any>()
    for (const r of results || []) {
      if (!resultByStudent.has(r.student_id)) {
        resultByStudent.set(r.student_id, r)
      }
    }

    const certByStudent = new Map<string, any>()
    for (const c of certificates || []) {
      if (!certByStudent.has(c.student_id)) {
        certByStudent.set(c.student_id, c)
      }
    }

    // Aggregate college-wise stats (case-insensitive normalization)
    const collegeMap = new Map<
      string,
      {
        displayName: string
        registered: number
        attempted: number
        scores: number[]
      }
    >()

    const courseMap = new Map<string, { registered: number; attempted: number }>()

    let totalAttempted = 0
    let totalSubmitted = 0

    for (const s of students) {
      const att = attemptByStudent.get(s.id)
      const hasAttempted = Boolean(att)
      const isSubmitted = att && (att.status === 'submitted' || att.status === 'timed_out')
      if (hasAttempted) totalAttempted++
      if (isSubmitted) totalSubmitted++

      const rawCollege = formatCollegeName(s.college_name || '', true)
      if (rawCollege) {
        const key = rawCollege.toLowerCase().replace(/\s+/g, ' ')
        if (!collegeMap.has(key)) {
          collegeMap.set(key, {
            displayName: rawCollege,
            registered: 0,
            attempted: 0,
            scores: [],
          })
        }
        const entry = collegeMap.get(key)!
        entry.registered += 1
        if (hasAttempted) entry.attempted += 1
        if (att && typeof att.score === 'number') entry.scores.push(att.score)
      }

      const courseName = (s.course || 'Unspecified').trim()
      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, { registered: 0, attempted: 0 })
      }
      const cEntry = courseMap.get(courseName)!
      cEntry.registered += 1
      if (hasAttempted) cEntry.attempted += 1
    }

    const collegeList = Array.from(collegeMap.values()).sort(
      (a, b) => b.registered - a.registered || a.displayName.localeCompare(b.displayName)
    )

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Metropolitan Surveillance Unit (MSU), Nagpur'
    workbook.created = new Date()

    const generatedAtIst = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    // ========================================================
    // SHEET 1: Participation Summary
    // ========================================================
    const summarySheet = workbook.addWorksheet('Participation Summary')
    summarySheet.columns = [
      { width: 42 },
      { width: 24 },
      { width: 24 },
    ]

    summarySheet.mergeCells('A1:C1')
    const titleCell = summarySheet.getCell('A1')
    titleCell.value = 'METROPOLITAN SURVEILLANCE UNIT (MSU), NAGPUR | NMC NAGPUR'
    titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    summarySheet.getRow(1).height = 28

    summarySheet.mergeCells('A2:C2')
    const subCell = summarySheet.getCell('A2')
    subCell.value = `World AMR Awareness Week (WAAW) 2026 — Official Participation Summary Report (Generated: ${generatedAtIst} IST)`
    subCell.font = { italic: true, size: 10, color: { argb: 'FF1E3A8A' } }
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
    subCell.alignment = { vertical: 'middle', horizontal: 'center' }
    summarySheet.getRow(2).height = 22

    summarySheet.addRow([])

    const metricHeader = summarySheet.addRow(['Key Participation Metric', 'Count', 'Remarks'])
    styleHeaderRow(metricHeader)

    const summaryMetrics = [
      ['Total Participating Health Facilities', collegeList.length, 'Unique facilities / institutions'],
      ['Total Registered Participants', students.length, 'All registered profiles'],
      ['Total Participants Who Played Quiz', totalAttempted, `${totalSubmitted} submitted`],
      ['Total Verified Certificates Issued', (certificates || []).length, 'Merit + Participation'],
    ]

    summaryMetrics.forEach((m, idx) => {
      const r = summarySheet.addRow(m)
      styleDataCellBorders(r, idx % 2 === 1)
      r.getCell(1).font = { bold: true, size: 10 }
      r.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF1D4ED8' } }
      r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
    })

    summarySheet.addRow([])
    const courseHeader = summarySheet.addRow(['Participant Category / Role', 'Registered Participants', 'Quiz Attempted'])
    styleHeaderRow(courseHeader)

    Array.from(courseMap.entries())
      .sort((a, b) => b[1].registered - a[1].registered)
      .forEach(([courseName, counts], idx) => {
        const r = summarySheet.addRow([courseName, counts.registered, counts.attempted])
        styleDataCellBorders(r, idx % 2 === 1)
        r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
        r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
      })

    // ========================================================
    // SHEET 2: Facility-wise Summary
    // ========================================================
    const collegeSheet = workbook.addWorksheet('Facility-wise Summary', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    collegeSheet.columns = [
      { header: 'Sr. No.', key: 'sr', width: 10 },
      { header: 'Name of Health Facility', key: 'college', width: 46 },
      { header: 'Registered Participants', key: 'registered', width: 22 },
      { header: 'Quiz Attempted', key: 'attempted', width: 18 },
      { header: 'Highest Score', key: 'highest', width: 16 },
      { header: 'Average Score', key: 'average', width: 16 },
    ]
    styleHeaderRow(collegeSheet.getRow(1))

    collegeList.forEach((c, idx) => {
      const highest = c.scores.length > 0 ? Math.max(...c.scores) : '-'
      const avg =
        c.scores.length > 0
          ? Number((c.scores.reduce((a, b) => a + b, 0) / c.scores.length).toFixed(1))
          : '-'
      const row = collegeSheet.addRow({
        sr: idx + 1,
        college: c.displayName,
        registered: c.registered,
        attempted: c.attempted,
        highest,
        average: avg,
      })
      styleDataCellBorders(row, idx % 2 === 1)
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Total Row
    const totalRow = collegeSheet.addRow({
      sr: '',
      college: `TOTAL (${collegeList.length} Health Facilities)`,
      registered: collegeList.reduce((acc, c) => acc + c.registered, 0),
      attempted: collegeList.reduce((acc, c) => acc + c.attempted, 0),
      highest: '',
      average: '',
    })
    totalRow.height = 24
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FF1E3A8A' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }

    // ========================================================
    // SHEET 3: All Participants List
    // ========================================================
    const listSheet = workbook.addWorksheet('All Participants List', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    listSheet.columns = [
      { header: 'Sr. No.', key: 'sr', width: 9 },
      { header: 'Registration ID', key: 'reg_id', width: 24 },
      { header: 'Full Name', key: 'full_name', width: 26 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Mobile Number', key: 'mobile', width: 18 },
      { header: 'Name of Health Facility', key: 'college', width: 38 },
      { header: 'Role / Category', key: 'course', width: 16 },
      { header: 'Location / Details', key: 'year_sem', width: 24 },
      { header: 'Quiz Status', key: 'status', width: 16 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Total Qs', key: 'total_qs', width: 10 },
      { header: 'Final Rank', key: 'rank', width: 12 },
      { header: 'Certificate Award', key: 'award', width: 24 },
      { header: 'Certificate ID', key: 'cert_id', width: 24 },
      { header: 'Registered At (IST)', key: 'created_at', width: 22 },
    ]
    styleHeaderRow(listSheet.getRow(1))

    students.forEach((s, idx) => {
      const att = attemptByStudent.get(s.id)
      const resRow = resultByStudent.get(s.id)
      const cert = certByStudent.get(s.id)

      const quizStatus = !att
        ? 'Registered Only'
        : att.status === 'submitted' || att.status === 'timed_out'
        ? 'Submitted'
        : 'In Progress'

      const regDateIst = s.created_at
        ? new Date(s.created_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-'

      const row = listSheet.addRow({
        sr: idx + 1,
        reg_id: s.registration_number || '-',
        full_name: formatPersonName(s.full_name || '', true) || '-',
        email: s.email || '-',
        mobile: s.mobile || '-',
        college: formatCollegeName(s.college_name || '', true) || 'Profile Incomplete',
        course: s.course || '-',
        year_sem: s.year_semester || '-',
        status: quizStatus,
        score: att && typeof att.score === 'number' ? att.score : '-',
        total_qs: att?.total_questions ?? '-',
        rank: resRow?.rank ?? att?.rank ?? '-',
        award: formatAwardLabel(cert?.certificate_type || resRow?.certificate_type),
        cert_id: cert?.certificate_number || '-',
        created_at: regDateIst,
      })
      styleDataCellBorders(row, idx % 2 === 1)
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' }
      row.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const dateStamp = new Date().toISOString().slice(0, 10)
    const fileName = `MSU_Nagpur_Quiz_Summary_Report_${dateStamp}.xlsx`

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate Excel report'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
