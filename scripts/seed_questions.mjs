import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const NEW_30_QUESTIONS = [
  {
    id: 'b0000001-0000-0000-0000-000000000001',
    question_text: 'What does AMR stand for in the context of the text?',
    option_a: 'Antiviral Medication Response',
    option_b: 'Advanced Medical Research',
    option_c: 'Antibiotic Management and Regulation',
    option_d: 'Antimicrobial Resistance',
    correct_option: 'D',
    explanation: 'AMR stands for Antimicrobial Resistance, which occurs when bacteria, viruses, fungi and parasites no longer respond to antimicrobial medicines.',
    topic: 'AMR Fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000002',
    question_text: 'What is the main focus of the One Health response to AMR led by WHO?',
    option_a: 'Emphasizing aquatic animal health only',
    option_b: 'Prioritizing plant and crop health',
    option_c: 'Exclusively focusing on human health',
    option_d: 'Involving human health, animals, and the environment',
    correct_option: 'D',
    explanation: 'One Health is an integrated approach that balances and optimizes the health of people, animals, and the environment.',
    topic: 'One Health & Stewardship',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000003',
    question_text: 'How many countries have developed AMR National Action Plans (NAPs)?',
    option_a: '180',
    option_b: '150',
    option_c: '170',
    option_d: '178',
    correct_option: 'D',
    explanation: 'According to tracking reports, 178 countries have developed AMR National Action Plans (NAPs).',
    topic: 'Policy & Global Action Plans',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000004',
    question_text: 'What are the 4 pillars of the framework for addressing AMR in the human health sector?',
    option_a: 'Prevention, Access to essential health services, Timely and accurate diagnosis, Appropriate and quality assured treatment',
    option_b: 'Prevention, Access to vaccines, Timely diagnosis, Appropriate treatment',
    option_c: 'Prevention, Access to healthcare, Timely diagnosis, Appropriate medication',
    option_d: 'Prevention, Access to antibiotics, Timely diagnosis, Quality treatment',
    correct_option: 'A',
    explanation: 'The 4 pillars are: Prevention; Access to essential health services; Timely and accurate diagnosis; and Appropriate, quality-assured treatment.',
    topic: 'Clinical Frameworks & Guidelines',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000005',
    question_text: 'What is the difference between antimicrobial resistance and antibiotic resistance?',
    option_a: 'They are the same',
    option_b: 'Antibiotic resistance is a subset of AMR and only refers to the resistance of bacteria against antibiotics',
    option_c: 'Antimicrobial resistance includes microorganisms such as viruses, parasites and fungi and not only bacteria',
    option_d: 'Both B and C are correct',
    correct_option: 'D',
    explanation: 'Antibiotic resistance refers specifically to resistance in bacteria against antibiotics, whereas AMR includes bacteria, viruses, fungi, and parasites.',
    topic: 'AMR Fundamentals',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000006',
    question_text: 'What can happen if you get an antimicrobial-resistant infection?',
    option_a: 'You may be sick for longer',
    option_b: 'You may have to visit your doctor more or be treated in a hospital',
    option_c: 'You may need more expensive/stronger medicine that can cause side effects',
    option_d: 'All of the above',
    correct_option: 'D',
    explanation: 'Resistant infections lead to prolonged illness, increased hospital visits/admissions, and the need for costlier second-line drugs with more severe side effects.',
    topic: 'Clinical Impact of AMR',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000007',
    question_text: 'Which of the following illnesses cannot be treated with antibiotics?',
    option_a: 'Food poisoning (salmonella)',
    option_b: 'Influenza',
    option_c: 'Chlamydia',
    option_d: 'UTI (e. coli)',
    correct_option: 'B',
    explanation: 'Influenza is caused by an influenza virus, and antibiotics are ineffective against viral infections.',
    topic: 'Rational Drug Use',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000008',
    question_text: 'Which of the following combinations would most likely contribute to the development of a superinfection?',
    option_a: 'Long-term use of narrow-spectrum antimicrobials',
    option_b: 'Long-term use of broad-spectrum antimicrobials',
    option_c: 'Short-term use of narrow-spectrum antimicrobials',
    option_d: 'Short-term use of broad-spectrum antimicrobials',
    correct_option: 'B',
    explanation: 'Long-term broad-spectrum antimicrobial therapy destroys protective commensal flora, allowing opportunistic pathogens or resistant microbes to cause a superinfection.',
    topic: 'Microbiology & Superinfections',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000009',
    question_text: 'What is the primary purpose of the WHO AWaRe classification of antibiotics?',
    option_a: 'To classify antibiotics according to their colour',
    option_b: 'To support antibiotic stewardship and monitor antibiotic use',
    option_c: 'To classify antibiotics according to their manufacturing cost',
    option_d: 'To identify antibiotics used exclusively in veterinary medicine',
    correct_option: 'B',
    explanation: 'The WHO AWaRe (Access, Watch, Reserve) classification is designed to support antibiotic stewardship activities and monitor antibiotic consumption.',
    topic: 'Antimicrobial Stewardship & AWaRe',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000010',
    question_text: 'Which statement about antimicrobial resistance is correct?',
    option_a: 'Only patients who take antibiotics can carry resistant bacteria',
    option_b: 'Resistance occurs only in hospitals',
    option_c: 'AMR can spread between people, animals and the environment',
    option_d: 'Antibiotic resistance affects only bacterial infections in adults',
    correct_option: 'C',
    explanation: 'Antimicrobial resistance spreads dynamically between people, animals, food, and the environment under the One Health framework.',
    topic: 'One Health & Stewardship',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000011',
    question_text: 'Which of the following is not a type of β-lactam antimicrobial?',
    option_a: 'Penicillins',
    option_b: 'Glycopeptides',
    option_c: 'Cephalosporins',
    option_d: 'Monobactams',
    correct_option: 'B',
    explanation: 'Glycopeptides (e.g., vancomycin) inhibit cell wall synthesis by binding to D-Ala-D-Ala, but they do not contain a beta-lactam ring.',
    topic: 'Pharmacology & Drug Classes',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000012',
    question_text: 'In the Kirby-Bauer disk diffusion test, the _______ of the zone of inhibition is measured and used for interpretation.',
    option_a: 'Diameter',
    option_b: 'Microbial population',
    option_c: 'Circumference',
    option_d: 'Depth',
    correct_option: 'A',
    explanation: 'The complete diameter of the zone of inhibition is measured in millimeters across the antimicrobial disk.',
    topic: 'Laboratory Diagnostics & AST',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000013',
    question_text: 'Which of the following techniques cannot be used to determine the minimum inhibitory concentration of an antimicrobial drug against a particular microbe?',
    option_a: 'Etest',
    option_b: 'Microbroth dilution test',
    option_c: 'Kirby-Bauer disk diffusion test',
    option_d: 'Macrobroth dilution test',
    correct_option: 'C',
    explanation: 'The Kirby-Bauer disk diffusion test is qualitative (categorizing into Susceptible, Intermediate, or Resistant) and cannot determine a quantitative MIC value.',
    topic: 'Laboratory Diagnostics & AST',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000014',
    question_text: 'What happens when bacteria become resistant to antibiotics?',
    option_a: 'Antibiotics become more effective.',
    option_b: 'Antibiotics may no longer kill or inhibit bacterial growth effectively.',
    option_c: 'Bacteria become viruses.',
    option_d: 'Infection disappears automatically.',
    correct_option: 'B',
    explanation: 'When bacteria develop resistance, standard concentrations of antibiotics can no longer kill them or effectively inhibit their growth.',
    topic: 'AMR Fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000015',
    question_text: 'What does the WHO AWaRe classification stand for?',
    option_a: 'Access, Watch and Reserve',
    option_b: 'Antibiotic, Water and Resistance',
    option_c: 'Action, Warning and Response',
    option_d: 'Access, Warning and Recovery',
    correct_option: 'A',
    explanation: 'AWaRe stands for Access, Watch, and Reserve—the three core categories defining global antibiotic stewardship.',
    topic: 'Antimicrobial Stewardship & AWaRe',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000016',
    question_text: 'MRSA stands for:',
    option_a: 'Multiple Resistant Streptococcus Aureus',
    option_b: 'Methicillin-Resistant Staphylococcus aureus',
    option_c: 'Medical Resistant Staphylococcus Antibiotic',
    option_d: 'Methicillin Reactive Staphylococcus aureus',
    correct_option: 'B',
    explanation: 'MRSA stands for Methicillin-Resistant Staphylococcus aureus, resistant to beta-lactam antibiotics via the mecA gene.',
    topic: 'Priority Pathogens',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000017',
    question_text: 'A patient forgets to take one dose of an antibiotic. What should the Pharmacy Officer advise?',
    option_a: 'Take double the next dose.',
    option_b: 'Stop the treatment.',
    option_c: 'Follow the medicine-specific missed-dose instructions and avoid doubling doses.',
    option_d: 'Take two different antibiotics.',
    correct_option: 'C',
    explanation: 'Patients should follow medicine-specific missed-dose directions and never double their dose due to increased risk of toxicity and adverse effects.',
    topic: 'Rational Drug Use & Pharmacy Practice',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000018',
    question_text: 'The Minimum Inhibitory Concentration (MIC) of an antibiotic is:',
    option_a: 'Lowest concentration that kills all bacterial cells',
    option_b: 'Lowest concentration that prevents visible bacterial growth',
    option_c: 'Highest concentration tolerated by the patient',
    option_d: 'Concentration that produces maximum bacterial growth inhibition in a patient',
    correct_option: 'B',
    explanation: 'MIC is defined as the lowest concentration of an antimicrobial that prevents visible in vitro growth of the bacterium after overnight incubation.',
    topic: 'Laboratory Diagnostics & AST',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000019',
    question_text: 'Should antibiotics be taken for a common cold?',
    option_a: 'Always',
    option_b: 'Only at night',
    option_c: 'No, because common cold is usually caused by viruses.',
    option_d: 'Yes, to prevent all future infections.',
    correct_option: 'C',
    explanation: 'The common cold is caused by viruses, and antibiotics have no effect against viral infections.',
    topic: 'Rational Drug Use',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000020',
    question_text: 'An isolate has an MIC of 2 mg/L. The applicable susceptibility breakpoints are S ≤ 1 mg/L, I = 2 mg/L and R ≥ 4 mg/L. How should the isolate be categorized?',
    option_a: 'Susceptible',
    option_b: 'Intermediate (I)',
    option_c: 'Resistant',
    option_d: 'Non-interpretable',
    correct_option: 'B',
    explanation: 'Because the measured MIC of 2 mg/L matches the defined breakpoint (I = 2 mg/L), it is categorized as Intermediate.',
    topic: 'AST Interpretation & Breakpoints',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000021',
    question_text: 'How can untreated hospital wastewater contribute to the spread of antimicrobial resistance?',
    option_a: 'By eliminating all susceptible bacteria',
    option_b: 'By releasing antibiotic residues, resistant bacteria and resistance genes into the environment',
    option_c: 'By increasing dissolved oxygen in rivers',
    option_d: 'By reducing microbial diversity in all aquatic ecosystems',
    correct_option: 'B',
    explanation: 'Hospital wastewater contains antibiotic residues, multi-resistant pathogens, and resistance plasmids that contaminate natural water bodies.',
    topic: 'One Health & Environmental AMR',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000022',
    question_text: 'Which of the following is the most appropriate practice for unused or expired antibiotics?',
    option_a: 'Dispose of them in household drains',
    option_b: 'Flush them into toilets',
    option_c: 'Follow authorised pharmaceutical take-back or biomedical/pharmaceutical waste disposal procedures',
    option_d: 'Mix them with general household waste without segregation',
    correct_option: 'C',
    explanation: 'Antibiotics should never be flushed down toilets or drains; they must be disposed of via authorized take-back schemes or biomedical waste protocols.',
    topic: 'Environmental AMR & Safe Disposal',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000023',
    question_text: 'Which analytical technique is commonly used to detect and quantify specific antimicrobial resistance genes in environmental samples?',
    option_a: 'ELISA',
    option_b: 'Quantitative PCR (qPCR)',
    option_c: 'Gram staining',
    option_d: 'Haemocytometry',
    correct_option: 'B',
    explanation: 'Quantitative Real-Time PCR (qPCR) is the primary molecular diagnostic technique used to detect and quantify antibiotic resistance genes (ARGs).',
    topic: 'Laboratory Diagnostics & Molecular Biology',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000024',
    question_text: 'Which of the following is an important indicator of faecal contamination in wastewater?',
    option_a: 'Escherichia coli',
    option_b: 'Lactobacillus acidophilus',
    option_c: 'Saccharomyces cerevisiae',
    option_d: 'Rhizobium species',
    correct_option: 'A',
    explanation: 'Escherichia coli is the globally recognized primary bacterial indicator of fecal contamination in water and wastewater.',
    topic: 'Microbiology & Environmental Surveillance',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000025',
    question_text: 'Which process is most directly associated with the transfer of antimicrobial resistance genes between bacteria through direct cell-to-cell contact?',
    option_a: 'Transformation',
    option_b: 'Transduction',
    option_c: 'Conjugation',
    option_d: 'Binary fission',
    correct_option: 'C',
    explanation: 'Conjugation is horizontal gene transfer mediated by a pilus through direct physical cell-to-cell contact.',
    topic: 'Resistance Genetics',
    difficulty: 'medium',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000026',
    question_text: 'A Pharmacy Officer is asked to recommend antibiotics for a patient with a viral upper respiratory tract infection. What is the most appropriate response?',
    option_a: 'Recommend a broad-spectrum antibiotic',
    option_b: 'Recommend a reserve antibiotic',
    option_c: 'Explain that antibiotics do not treat viral infections and avoid unnecessary antibiotic use',
    option_d: 'Recommend two antibiotics together',
    correct_option: 'C',
    explanation: 'Antibiotics are ineffective against viral upper respiratory tract infections. The Pharmacy Officer should educate the patient on symptomatic relief.',
    topic: 'Rational Drug Use & Pharmacy Practice',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000027',
    question_text: 'Which of the following can carry antibiotic resistance genes between bacterial cells?',
    option_a: 'Plasmids',
    option_b: 'Ribosomes',
    option_c: 'Mitochondria',
    option_d: 'Lysosomes',
    correct_option: 'A',
    explanation: 'Plasmids are mobile extra-chromosomal DNA elements that frequently carry resistance genes and transfer between bacterial cells.',
    topic: 'Resistance Genetics',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000028',
    question_text: 'How can the excessive use of antibiotics in humans contribute to antimicrobial resistance in aquatic ecosystems?',
    option_a: 'Antibiotics and resistant bacteria can enter sewage through human excretion',
    option_b: 'Antibiotics are completely destroyed inside the human body',
    option_c: 'Antibiotic use increases oxygen concentration in rivers',
    option_d: 'Antibiotics cannot enter wastewater',
    correct_option: 'A',
    explanation: 'Unmetabolized antibiotics and resistant bacteria are excreted in human urine and feces, entering wastewater systems and selecting for resistance in aquatic environments.',
    topic: 'One Health & Environmental AMR',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000029',
    question_text: 'Which of the following microorganisms can develop antimicrobial resistance?',
    option_a: 'Bacteria only',
    option_b: 'Viruses only',
    option_c: 'Bacteria, viruses, fungi and parasites',
    option_d: 'Human cells',
    correct_option: 'C',
    explanation: 'Antimicrobial resistance (AMR) encompasses bacteria (antibiotics), viruses (antivirals), fungi (antifungals), and parasites (antiprotozoals).',
    topic: 'AMR Fundamentals',
    difficulty: 'easy',
  },
  {
    id: 'b0000001-0000-0000-0000-000000000030',
    question_text: 'Which was the first antibiotic to be mass-produced on an industrial scale?',
    option_a: 'Streptomycin',
    option_b: 'Penicillin',
    option_c: 'Tetracycline',
    option_d: 'Chloramphenicol',
    correct_option: 'B',
    explanation: 'Penicillin, discovered by Alexander Fleming, was the first antibiotic to be industrially mass-produced during World War II.',
    topic: 'History of Antibiotics',
    difficulty: 'easy',
  },
]

async function seed30() {
  console.log(`Starting migration to exactly ${NEW_30_QUESTIONS.length} AMR MCQs...`)

  // 1. Delete dependent relations for competition if needed
  // Keep attempts for existing competition safe or clear relations
  const compId = '88a28719-5b2a-41d3-b228-3288c83b771f'

  // Update competition total_questions to 30
  await supabase.from('competitions').update({ total_questions: 30 }).eq('id', compId)

  // 2. Clear old question bank
  // To avoid foreign key issues, remove from competition_questions first
  await supabase.from('competition_questions').delete().eq('competition_id', compId)

  // Clear question_bank
  const { error: delError } = await supabase.from('question_bank').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.error('Error clearing question_bank:', delError)
    process.exit(1)
  }
  console.log('Old question bank cleared successfully.')

  // 3. Insert the 30 new questions
  const { data: inserted, error: insError } = await supabase.from('question_bank').insert(NEW_30_QUESTIONS).select('id, question_text')
  if (insError) {
    console.error('Error inserting 30 questions:', insError)
    process.exit(1)
  }
  console.log(`Successfully inserted ${inserted.length} questions into question_bank!`)

  // 4. Link all 30 questions to the competition
  const links = inserted.map((q, idx) => ({
    competition_id: compId,
    question_id: q.id,
    display_order: idx + 1,
  }))
  const { error: linkErr } = await supabase.from('competition_questions').insert(links)
  if (linkErr) {
    console.error('Error linking questions to competition:', linkErr)
  } else {
    console.log(`Successfully linked ${links.length} questions to competition ${compId}!`)
  }

  // 5. Update migration 003_seed_amr_data.sql
  const esc = (s) => (s || '').replace(/'/g, "''")
  let sql = `-- ============================================================
-- AMR Quiz Portal - Seed Data (30 AMR MCQs + Sample Competition)
-- Migration: 003_seed_amr_data.sql
-- ============================================================

-- Insert 30 Specialized AMR & Microbiology Questions
INSERT INTO question_bank (id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
VALUES
`
  const values = NEW_30_QUESTIONS.map(q => `(
  '${q.id}',
  '${esc(q.question_text)}',
  '${esc(q.option_a)}',
  '${esc(q.option_b)}',
  '${esc(q.option_c)}',
  '${esc(q.option_d)}',
  '${q.correct_option}',
  '${esc(q.explanation)}',
  '${esc(q.topic)}',
  '${q.difficulty}'
)`).join(',\n')

  sql += values + `\nON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  option_a = EXCLUDED.option_a,
  option_b = EXCLUDED.option_b,
  option_c = EXCLUDED.option_c,
  option_d = EXCLUDED.option_d,
  correct_option = EXCLUDED.correct_option,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty;

-- Create Initial Competition for AMR Awareness Week 2026
INSERT INTO competitions (
  id,
  title,
  description,
  status,
  scheduled_start,
  scheduled_end,
  duration_seconds,
  total_questions,
  passing_score,
  max_participants
)
VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'World AMR Awareness Week 2026 – National Quiz Competition',
  'Sensitization of Future Practitioners - Pharmacy & Microbiology College Students. 30 MCQs, 10 Minutes. Compete for First, Second, Third Prize and earn digital verified certificates.',
  'scheduled',
  NOW() - INTERVAL '5 minutes',
  NOW() + INTERVAL '24 hours',
  600,
  30,
  18,
  1000
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  scheduled_start = EXCLUDED.scheduled_start,
  scheduled_end = EXCLUDED.scheduled_end,
  total_questions = EXCLUDED.total_questions;

-- Link all 30 questions to this competition
INSERT INTO competition_questions (competition_id, question_id, display_order)
SELECT 
  'c0000001-0000-0000-0000-000000000001'::UUID,
  q.id,
  ROW_NUMBER() OVER (ORDER BY q.id)
FROM question_bank q
ON CONFLICT (competition_id, question_id) DO NOTHING;

-- Seed default certificate signatories
INSERT INTO certificate_signatories (competition_id, name, designation, signature_path, display_order)
VALUES
('c0000001-0000-0000-0000-000000000001', 'Dr. Rajesh Sharma', 'Organizing Authority & Chairperson', null, 1),
('c0000001-0000-0000-0000-000000000001', 'Prof. Sunita Verma', 'Head of Microbiology Department', null, 2),
('c0000001-0000-0000-0000-000000000001', 'Dr. Amit Patel', 'Programme Coordinator, WAAW', null, 3)
ON CONFLICT (competition_id, display_order) DO UPDATE SET
  name = EXCLUDED.name,
  designation = EXCLUDED.designation;
`

  fs.writeFileSync('supabase/migrations/003_seed_amr_data.sql', sql, 'utf8')
  console.log('Successfully updated supabase/migrations/003_seed_amr_data.sql')
}

seed30().catch(err => {
  console.error('Error running seed30:', err)
  process.exit(1)
})
