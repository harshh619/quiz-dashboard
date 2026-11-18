'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { extractAllCategories, parseCategoryTopic } from '@/lib/questionCategories'
import { Calendar, Plus, CheckCircle2, Trash2 } from 'lucide-react'

export default function AdminCompetitionsPage() {
  const supabase = createClient()
  const [competitions, setCompetitions] = useState<any[]>([])
  const [bankQuestions, setBankQuestions] = useState<Array<{ id: string; topic: string }>>([])
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const [newComp, setNewComp] = useState({
    title: 'World AMR Awareness Week 2026 – Online Quiz Competition',
    description: 'National Quiz Competition for Health Sciences Students.',
    scheduled_start: '',
    duration_minutes: 10,
    total_questions: 30,
    passing_score: 18,
    max_participants: 1000,
    status: 'draft',
  })

  useEffect(() => {
    // Round to nearest minute
    const now = new Date()
    now.setSeconds(0, 0)
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    setNewComp(prev => ({
      ...prev,
      scheduled_start: localIso,
      duration_minutes: 10,
    }))
  }, [])

  const loadCompetitions = async () => {
    setLoading(true)
    const [{ data }, { data: qData }] = await Promise.all([
      supabase.from('competitions').select('*').order('created_at', { ascending: false }),
      supabase.from('question_bank').select('id, topic'),
    ])

    setCompetitions(data || [])
    setBankQuestions((qData as Array<{ id: string; topic: string }>) || [])
    setLoading(false)
  }

  const questionCategories = useMemo(
    () => extractAllCategories(bankQuestions),
    [bankQuestions]
  )

  const matchingBankQuestions = useMemo(() => {
    if (selectedQuestionCategory === 'all') return bankQuestions
    return bankQuestions.filter(
      (q) => parseCategoryTopic(q.topic).category === selectedQuestionCategory
    )
  }, [bankQuestions, selectedQuestionCategory])

  useEffect(() => {
    loadCompetitions()
  }, [])

  const handleUpdateStatus = async (compId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', compId)

      if (error) throw error
      setStatusMsg(`Competition status updated to ${status}!`)
      await loadCompetitions()
    } catch (err: unknown) {
      alert('Failed to update status')
    }
  }

  const handleDeleteCompetition = async (compId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', compId)

      if (error) throw error
      setStatusMsg('Competition deleted successfully!')
      await loadCompetitions()
    } catch (err: any) {
      alert(`Failed to delete competition: ${err.message}`)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const questionsToLink = matchingBankQuestions.slice(0, 30)
      if (questionsToLink.length === 0) {
        alert(`No questions found in category "${selectedQuestionCategory}". Please add questions to this category first or select another category.`)
        return
      }

      const startTime = new Date(newComp.scheduled_start)
      const durationMin = Number(newComp.duration_minutes) || 10
      const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000)

      const payload = {
        title: newComp.title,
        description: newComp.description,
        scheduled_start: startTime.toISOString(),
        scheduled_end: endTime.toISOString(),
        duration_seconds: durationMin * 60,
        total_questions: questionsToLink.length,
        passing_score: Math.ceil(questionsToLink.length * 0.6),
        max_participants: newComp.max_participants,
        status: 'draft',
      }

      const { data, error } = await supabase.from('competitions').insert([payload]).select().single()

      if (error) throw error

      // Link questions from the selected Question Bank category
      const links = questionsToLink.map((q, idx) => ({
        competition_id: data.id,
        question_id: q.id,
        display_order: idx + 1,
      }))
      await supabase.from('competition_questions').insert(links)

      setShowCreateModal(false)
      setStatusMsg(
        `New competition saved as Draft (${durationMin} mins, ${questionsToLink.length} questions linked${
          selectedQuestionCategory !== 'all' ? ` from "${selectedQuestionCategory}"` : ''
        }). Switch status to "Scheduled" when ready to publish!`
      )
      await loadCompetitions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed'
      alert(msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Competitions &amp; Exam Schedule</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control live exam start times, durations, and student registration status.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Competition</span>
          </button>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {competitions.map((comp) => (
            <div key={comp.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{comp.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {comp.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{comp.description}</p>
                </div>

                <button
                  onClick={() => handleDeleteCompetition(comp.id, comp.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                  title="Delete Competition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Quiz</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Start Time</span>
                  <span className="font-semibold text-gray-800">{new Date(comp.scheduled_start).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">End Time</span>
                  <span className="font-semibold text-gray-800">{new Date(comp.scheduled_end).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Duration &amp; Qs</span>
                  <span className="font-semibold text-gray-800">{comp.duration_seconds / 60} Mins ({comp.total_questions} MCQs)</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Capacity</span>
                  <span className="font-semibold text-gray-800">Max {comp.max_participants} Students</span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium mr-2">Status:</span>
                {([
                  { key: 'draft', label: 'Draft' },
                  { key: 'scheduled', label: 'Scheduled (Auto Live by Time)' },
                  { key: 'results_published', label: 'Result Published' },
                ] as const).map((st) => (
                  <button
                    key={st.key}
                    onClick={() => handleUpdateStatus(comp.id, st.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      comp.status === st.key
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Schedule New Competition</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Competition Title *</label>
                <input
                  type="text"
                  required
                  value={newComp.title}
                  onChange={(e) => setNewComp({ ...newComp, title: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newComp.description}
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newComp.scheduled_start}
                    onChange={(e) => setNewComp({ ...newComp, scheduled_start: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Starting date &amp; time of the quiz
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">Duration (Minutes) *</label>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                      {newComp.duration_minutes} Mins
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="180"
                        step="1"
                        value={newComp.duration_minutes}
                        onChange={(e) => setNewComp({ ...newComp, duration_minutes: Number(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="1"
                        max="300"
                        required
                        value={newComp.duration_minutes}
                        onChange={(e) => setNewComp({ ...newComp, duration_minutes: Math.max(1, Number(e.target.value)) })}
                        className="w-16 p-2 rounded-lg border border-gray-300 text-center font-bold text-xs"
                      />
                    </div>
                    {newComp.scheduled_start && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 block">
                        Calculated End Time: <strong>{new Date(new Date(newComp.scheduled_start).getTime() + (Number(newComp.duration_minutes) || 10) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({new Date(new Date(newComp.scheduled_start).getTime() + (Number(newComp.duration_minutes) || 10) * 60000).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Bank Category *</label>
                <select
                  value={selectedQuestionCategory}
                  onChange={(e) => setSelectedQuestionCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white font-medium text-gray-800"
                >
                  <option value="all">All Categories ({bankQuestions.length} Qs available)</option>
                  {questionCategories.map((cat) => {
                    const count = bankQuestions.filter(
                      (q) => parseCategoryTopic(q.topic).category === cat
                    ).length
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count} Qs available)
                      </option>
                    )
                  })}
                </select>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Up to 30 questions from this category will be linked automatically.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
                >
                  Create &amp; Link {Math.min(30, matchingBankQuestions.length)} Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
