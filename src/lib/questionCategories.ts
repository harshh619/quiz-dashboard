export const CATEGORY_SEPARATOR = ' :: '

export const DEFAULT_QUESTION_CATEGORIES = [
  'World AMR Awareness Week (WAAW)',
  'World Rabies Day',
  'Intensified Diarrhoea Control Fortnight (IDCF)',
  'World Viral Hepatitis Day',
  'World Zoonotic Disease Day',
] as const

export function formatCategoryTopic(category: string, subtopic?: string): string {
  const cleanCat = category.trim()
  const cleanSub = (subtopic || '').trim()
  if (!cleanCat) return cleanSub || DEFAULT_QUESTION_CATEGORIES[0]
  if (!cleanSub) return cleanCat
  return `${cleanCat}${CATEGORY_SEPARATOR}${cleanSub}`
}

export function parseCategoryTopic(rawTopic?: string | null): {
  category: string
  subtopic: string
  displayLabel: string
} {
  const raw = (rawTopic || '').trim()
  if (!raw) {
    return {
      category: DEFAULT_QUESTION_CATEGORIES[0],
      subtopic: '',
      displayLabel: DEFAULT_QUESTION_CATEGORIES[0],
    }
  }

  if (raw.includes(CATEGORY_SEPARATOR)) {
    const [cat, ...rest] = raw.split(CATEGORY_SEPARATOR)
    const category = cat.trim() || DEFAULT_QUESTION_CATEGORIES[0]
    const subtopic = rest.join(CATEGORY_SEPARATOR).trim()
    return {
      category,
      subtopic,
      displayLabel: subtopic || category,
    }
  }

  // If raw exactly matches a default category
  const exactDefault = DEFAULT_QUESTION_CATEGORIES.find(
    (c) => c.toLowerCase() === raw.toLowerCase()
  )
  if (exactDefault) {
    return {
      category: exactDefault,
      subtopic: '',
      displayLabel: exactDefault,
    }
  }

  // Legacy uncategorized AMR questions fall under World AMR Awareness Week (WAAW)
  return {
    category: DEFAULT_QUESTION_CATEGORIES[0],
    subtopic: raw,
    displayLabel: raw,
  }
}

export function extractAllCategories(questions: Array<{ topic?: string | null }>): string[] {
  const set = new Set<string>(DEFAULT_QUESTION_CATEGORIES)
  for (const q of questions) {
    const { category } = parseCategoryTopic(q.topic)
    if (category) set.add(category)
  }
  return Array.from(set)
}
