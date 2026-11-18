'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { createClient } from '@/lib/supabase/client'
import {
  DEFAULT_QUESTION_CATEGORIES,
  extractAllCategories,
  formatCategoryTopic,
  parseCategoryTopic,
} from '@/lib/questionCategories'
import { Plus, Search, Trash2, Tag, FolderPlus, CheckCircle2 } from 'lucide-react'

const NEW_CATEGORY_OPTION = '__NEW_CATEGORY__'

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newQ, setNewQ] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    subtopic: '',
    difficulty: 'medium',
  })

  const loadQuestions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('question_bank')
      .select('*')
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  // Combine default categories + categories found in DB + any newly created custom ones in this session
  const allCategories = useMemo(() => {
    const extracted = extractAllCategories(questions)
    const merged = new Set<string>([...extracted, ...customCategories])
    return Array.from(merged)
  }, [questions, customCategories])

  // Count questions per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of allCategories) counts[cat] = 0
    for (const q of questions) {
      const { category } = parseCategoryTopic(q.topic)
      counts[category] = (counts[category] || 0) + 1
    }
    return counts
  }, [questions, allCategories])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalCategory =
      selectedCategory === NEW_CATEGORY_OPTION
        ? newCategoryName.trim()
        : selectedCategory.trim()

    if (!finalCategory) {
      alert('Please select a category or enter a new category name.')
      return
    }

    try {
      const formattedTopic = formatCategoryTopic(finalCategory, newQ.subtopic)

      const { error } = await supabase.from('question_bank').insert([
        {
          question_text: newQ.question_text.trim(),
          option_a: newQ.option_a.trim(),
          option_b: newQ.option_b.trim(),
          option_c: newQ.option_c.trim(),
          option_d: newQ.option_d.trim(),
          correct_option: newQ.correct_option,
          explanation: newQ.explanation.trim(),
          topic: formattedTopic,
          difficulty: newQ.difficulty,
        },
      ])

      if (error) throw error

      if (!allCategories.includes(finalCategory)) {
        setCustomCategories((prev) => [...prev, finalCategory])
      }

      setShowAddModal(false)
      setSelectedCategory('')
      setNewCategoryName('')
      setNewQ({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: '',
        subtopic: '',
        difficulty: 'medium',
      })
      setStatusMsg(`Question added under "${finalCategory}"!`)
      await loadQuestions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add question'
      alert(msg)
    }
  }

  const handleUpdateQuestionCategory = async (q: any, targetCategory: string) => {
    try {
      const { subtopic } = parseCategoryTopic(q.topic)
      const updatedTopic = formatCategoryTopic(targetCategory, subtopic)
      const { error } = await supabase
        .from('question_bank')
        .update({ topic: updatedTopic, updated_at: new Date().toISOString() })
        .eq('id', q.id)

      if (error) throw error
      setStatusMsg(`Question moved to "${targetCategory}".`)
      await loadQuestions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update category'
      alert(msg)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question from the Question Bank?')) return
    try {
      const { error } = await supabase.from('question_bank').delete().eq('id', id)
      if (error) throw error
      setStatusMsg('Question deleted.')
      await loadQuestions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete question'
      alert(msg)
    }
  }

  const handleQuickAddCategory = () => {
    const name = prompt('Enter new category name (e.g. World TB Day, Dengue Awareness):')
    if (!name || !name.trim()) return
    const trimmed = name.trim()
    if (!allCategories.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed])
    }
    setFilterCategory(trimmed)
    setStatusMsg(`Category "${trimmed}" added! You can now add questions to it.`)
  }

  const filteredQuestions = questions.filter((q) => {
    const { category, subtopic } = parseCategoryTopic(q.topic)
    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      q.question_text?.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query) ||
      subtopic.toLowerCase().includes(query)
    const matchesCategory = filterCategory === 'all' || category === filterCategory
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty
    return matchesSearch && matchesCategory && matchesDiff
  })

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Question Bank &amp; Categories
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize MCQs by health awareness campaigns (AMR Week, Rabies Day, IDCF, Viral Hepatitis Day, Zoonotic Disease Day, etc.).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleQuickAddCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-blue-600" />
              <span>New Category</span>
            </button>

            <button
              onClick={() => {
                setSelectedCategory(filterCategory !== 'all' ? filterCategory : '')
                setNewCategoryName('')
                setShowAddModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-emerald-700 hover:underline text-[11px] font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Categories:
            </span>

            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterCategory === 'all'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
              }`}
            >
              All ({questions.length})
            </button>

            {allCategories.map((cat) => {
              const count = categoryCounts[cat] || 0
              const isActive = filterCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}{' '}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                      isActive ? 'bg-blue-600 text-blue-100' : 'bg-white text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search, Category Dropdown & Difficulty bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-gray-100">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question text, category, or sub-topic..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 font-medium"
            >
              <option value="all">All Categories ({questions.length})</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>

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
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xs">Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <p className="text-gray-500 text-xs font-medium">
                No questions found{filterCategory !== 'all' ? ` in "${filterCategory}"` : ''}.
              </p>
              {filterCategory !== 'all' && (
                <button
                  onClick={() => {
                    setSelectedCategory(filterCategory)
                    setShowAddModal(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Question to {filterCategory}</span>
                </button>
              )}
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const { category, subtopic } = parseCategoryTopic(q.topic)
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Q{idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" />
                        {category}
                      </span>
                      {subtopic && (
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          · {subtopic}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <select
                        value={category}
                        onChange={(e) => handleUpdateQuestionCategory(q, e.target.value)}
                        title="Change Category"
                        className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 bg-slate-50 text-gray-700 max-w-[180px]"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          q.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty === 'medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Delete Question"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
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
              )
            })
          )}
        </div>
      </main>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900">Add New MCQ to Question Bank</h3>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              {/* Mandatory Category Selector + Add New Category */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2.5">
                <div>
                  <label className="block font-bold text-blue-950 mb-1">
                    Quiz Category / Campaign *
                  </label>
                  <select
                    required
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-blue-200 text-xs bg-white text-gray-900 font-semibold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="" disabled>
                      -- Select a Category (Required) --
                    </option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value={NEW_CATEGORY_OPTION}>+ Add New Category...</option>
                  </select>
                </div>

                {selectedCategory === NEW_CATEGORY_OPTION && (
                  <div>
                    <label className="block font-semibold text-blue-900 mb-1">
                      New Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. World TB Day, National Dengue Day, Malaria Awareness..."
                      className="w-full p-2.5 rounded-lg border border-blue-300 bg-white text-xs text-gray-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={newQ.question_text}
                  onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
                  placeholder="Enter MCQ question..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-900 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Correct Answer *</label>
                  <select
                    value={newQ.correct_option}
                    onChange={(e) => setNewQ({ ...newQ, correct_option: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sub-topic (Optional)</label>
                  <input
                    type="text"
                    value={newQ.subtopic}
                    onChange={(e) => setNewQ({ ...newQ, subtopic: e.target.value })}
                    placeholder="e.g. Vaccination, ORS"
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newQ.difficulty}
                    onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })}
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
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
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
