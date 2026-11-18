// ============================================
// Automatic Proper Case / Title Case Formatters
// Ensures student names & college names stay clean and uniform
// across Certificates, Admin Tables, and Excel Reports.
// ============================================

const MINOR_COLLEGE_WORDS = new Set([
  'of',
  'and',
  'for',
  'in',
  'at',
  'on',
  'the',
  'to',
  'by',
])

const KNOWN_INSTITUTION_ACRONYMS = new Set([
  'RTMNU',
  'MUHS',
  'AIIMS',
  'GMC',
  'IGGMC',
  'NMC',
  'MSU',
  'VNIT',
  'LAD',
  'SKB',
  'DBATU',
  'SPPU',
  'ICMR',
  'NCDC',
  'PG',
  'UG',
  'MLT',
  'DMLT',
  'BMLT',
  'II',
  'III',
  'IV',
  'KDK',
  'GHR',
  'GHRCEM',
  'YCCE',
  'JDCOEM',
  'SVPCET',
  'GCOEN',
  'LIT',
  'IIIT',
  'NIT',
  'IIT',
  'NKP',
  'NKPSIMS',
  'DMIMS',
  'DMIHER',
  'JNMC',
  'MGIMS',
  'SVIMS',
  'BAMS',
  'BHMS',
  'MBBS',
  'BDS',
  'MDS',
  'MD',
  'MS',
  'AMR',
  'WAAW',
  'UPHC',
  'AYUSH',
  'IGR',
  'HWC',
  'PHC',
  'CHC',
  'SDH',
  'DH',
])

function toTitleAlpha(alpha: string): string {
  if (!alpha) return ''
  return alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase()
}

/**
 * Formats a person's full name into clean Proper Case:
 *   "harsh wardhan chandel" -> "Harsh Wardhan Chandel"
 *   "HARSH WARDHAN CHANDEL" -> "Harsh Wardhan Chandel"
 *   "a.k. sharma"           -> "A.K. Sharma"
 *   "dr. harsh chandel"     -> "Dr. Harsh Chandel"
 *
 * When finalize=false (live typing), whitespace is untouched so the cursor never jumps.
 * When finalize=true (onBlur / onSubmit), leading/trailing & repeated spaces are cleaned.
 */
export function formatPersonName(input: string, finalize = false): string {
  if (!input) return ''
  const base = finalize ? input.trim().replace(/\s+/g, ' ') : input
  if (!base) return ''

  return base.replace(/\S+/g, (word) =>
    word
      .split('.')
      .map((dotPart) =>
        dotPart ? dotPart.replace(/[A-Za-z]+/g, (alpha) => toTitleAlpha(alpha)) : ''
      )
      .join('.')
  )
}

/**
 * Formats a college / institution name into clean Proper Case while preserving:
 * - Lowercase connectors in the middle ("of", "and", "for", "in", "the", ...)
 * - Common Indian university / medical / Nagpur college acronyms (RTMNU, GMC, LAD, MUHS, ...)
 * - Dotted initials ("s.k.b." -> "S.K.B.", "smt." -> "Smt.", "dr." -> "Dr.")
 *
 * Examples:
 *   "government college of pharmacy, nagpur" -> "Government College of Pharmacy, Nagpur"
 *   "DEPARTMENT OF MICROBIOLOGY, RTMNU, NAGPUR" -> "Department of Microbiology, RTMNU, Nagpur"
 *   "smt. kishoritai bhoyar college of pharmacy" -> "Smt. Kishoritai Bhoyar College of Pharmacy"
 */
export function formatCollegeName(input: string, finalize = false): string {
  if (!input) return ''
  const base = finalize ? input.trim().replace(/\s+/g, ' ') : input
  if (!base) return ''

  let wordIndex = 0
  let forceCapitalizeNext = true

  return base.replace(/\S+/g, (word) => {
    const isStart = wordIndex === 0 || forceCapitalizeNext
    wordIndex += 1

    // Check if this word ends with punctuation that starts a new clause/segment
    forceCapitalizeNext = /[,:\-/(]$/.test(word)

    // Strip outer punctuation just to test acronym / minor word cleanly
    const cleanLower = word.toLowerCase()
    const alphaOnly = word.replace(/[^A-Za-z]/g, '')
    const alphaUpper = alphaOnly.toUpperCase()

    // Pure known acronym (e.g., "rtmnu", "rtmnu,", "(gmc)")
    if (
      alphaOnly.length >= 2 &&
      !word.includes('.') &&
      KNOWN_INSTITUTION_ACRONYMS.has(alphaUpper)
    ) {
      return word.replace(/[A-Za-z]+/g, (seg) => seg.toUpperCase())
    }

    // Minor connector word in the middle of the name (only when standalone word without punctuation)
    if (!isStart && MINOR_COLLEGE_WORDS.has(cleanLower)) {
      return cleanLower
    }

    // Standard word / dotted initials / hyphenated words
    return word
      .split('.')
      .map((dotPart) => {
        if (!dotPart) return ''
        return dotPart.replace(/[A-Za-z]+/g, (alpha) => {
          const upper = alpha.toUpperCase()
          if (KNOWN_INSTITUTION_ACRONYMS.has(upper) && !word.includes('.')) {
            return upper
          }
          return toTitleAlpha(alpha)
        })
      })
      .join('.')
  })
}
