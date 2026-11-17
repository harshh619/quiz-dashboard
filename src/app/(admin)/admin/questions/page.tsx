'use client'

import { useState, useEffect } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, Plus, Search, Filter, CheckCircle2, Trash2 } from 'lucide-react'

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [newQ, setNewQ] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    topic: 'AMR Stewardship',
    difficulty: 'medium',
  })

  const loadQuestions = async () => {
    setLoading(true)
    const { data } = await supabase.from('question_bank').select('*').order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('question_bank').insert([newQ])
      if (error) throw error
      setShowAddModal(false)
      setNewQ({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: '',
        topic: 'AMR Stewardship',
        difficulty: 'medium',
      })
      await loadQuestions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add question'
      alert(msg)
    }
  }

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(search.toLowerCase()) ||
                          q.topic?.toLowerCase().includes(search.toLowerCase())
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty
    return matchesSearch && matchesDiff
  })

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              AMR Question Bank
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage questions, MCQs, answer keys, and explanations for the competition.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Question</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question text or topic..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
            />
          </div>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xs">Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-xs">
              No questions found matching your filter.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Q{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {q.topic}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <p className="text-sm font-bold text-gray-900 leading-relaxed">
                  {q.question_text}
                </p>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const optText = q[`option_${key.toLowerCase()}`]
                    const isCorrect = q.correct_option === key
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-gray-50/50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {key}
                        </span>
                        <span className="leading-snug">{optText}</span>
                      </div>
                    )
                  })}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="text-gray-700">Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

      </main>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900">Add New MCQ to Bank</h3>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={newQ.question_text}
                  onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
                  placeholder="Enter AMR question..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={newQ.option_a}
                    onChange={(e) => setNewQ({ ...newQ, option_a: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={newQ.option_b}
                    onChange={(e) => setNewQ({ ...newQ, option_b: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    value={newQ.option_c}
                    onChange={(e) => setNewQ({ ...newQ, option_c: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    value={newQ.option_d}
                    onChange={(e) => setNewQ({ ...newQ, option_d: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Correct Answer *</label>
                  <select
                    value={newQ.correct_option}
                    onChange={(e) => setNewQ({ ...newQ, correct_option: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={newQ.topic}
                    onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newQ.difficulty}
                    onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={newQ.explanation}
                  onChange={(e) => setNewQ({ ...newQ, explanation: e.target.value })}
                  placeholder="Why is this answer correct?"
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs text-gray-900"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
