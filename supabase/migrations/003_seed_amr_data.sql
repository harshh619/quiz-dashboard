-- ============================================================
-- AMR Quiz Portal - Seed Data (30 AMR MCQs + Sample Competition)
-- Migration: 003_seed_amr_data.sql
-- ============================================================

-- Insert 30 Specialized AMR & Microbiology Questions
INSERT INTO question_bank (id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'What does AMR stand for in the context of the text?',
  'Antiviral Medication Response',
  'Advanced Medical Research',
  'Antibiotic Management and Regulation',
  'Antimicrobial Resistance',
  'D',
  'AMR stands for Antimicrobial Resistance, which occurs when bacteria, viruses, fungi and parasites no longer respond to antimicrobial medicines.',
  'AMR Fundamentals',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000002',
  'What is the main focus of the One Health response to AMR led by WHO?',
  'Emphasizing aquatic animal health only',
  'Prioritizing plant and crop health',
  'Exclusively focusing on human health',
  'Involving human health, animals, and the environment',
  'D',
  'One Health is an integrated approach that balances and optimizes the health of people, animals, and the environment.',
  'One Health & Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000003',
  'How many countries have developed AMR National Action Plans (NAPs)?',
  '180',
  '150',
  '170',
  '178',
  'D',
  'According to tracking reports, 178 countries have developed AMR National Action Plans (NAPs).',
  'Policy & Global Action Plans',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000004',
  'What are the 4 pillars of the framework for addressing AMR in the human health sector?',
  'Prevention, Access to essential health services, Timely and accurate diagnosis, Appropriate and quality assured treatment',
  'Prevention, Access to vaccines, Timely diagnosis, Appropriate treatment',
  'Prevention, Access to healthcare, Timely diagnosis, Appropriate medication',
  'Prevention, Access to antibiotics, Timely diagnosis, Quality treatment',
  'A',
  'The 4 pillars are: Prevention; Access to essential health services; Timely and accurate diagnosis; and Appropriate, quality-assured treatment.',
  'Clinical Frameworks & Guidelines',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000005',
  'What is the difference between antimicrobial resistance and antibiotic resistance?',
  'They are the same',
  'Antibiotic resistance is a subset of AMR and only refers to the resistance of bacteria against antibiotics',
  'Antimicrobial resistance includes microorganisms such as viruses, parasites and fungi and not only bacteria',
  'Both B and C are correct',
  'D',
  'Antibiotic resistance refers specifically to resistance in bacteria against antibiotics, whereas AMR includes bacteria, viruses, fungi, and parasites.',
  'AMR Fundamentals',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000006',
  'What can happen if you get an antimicrobial-resistant infection?',
  'You may be sick for longer',
  'You may have to visit your doctor more or be treated in a hospital',
  'You may need more expensive/stronger medicine that can cause side effects',
  'All of the above',
  'D',
  'Resistant infections lead to prolonged illness, increased hospital visits/admissions, and the need for costlier second-line drugs with more severe side effects.',
  'Clinical Impact of AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000007',
  'Which of the following illnesses cannot be treated with antibiotics?',
  'Food poisoning (salmonella)',
  'Influenza',
  'Chlamydia',
  'UTI (e. coli)',
  'B',
  'Influenza is caused by an influenza virus, and antibiotics are ineffective against viral infections.',
  'Rational Drug Use',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000008',
  'Which of the following combinations would most likely contribute to the development of a superinfection?',
  'Long-term use of narrow-spectrum antimicrobials',
  'Long-term use of broad-spectrum antimicrobials',
  'Short-term use of narrow-spectrum antimicrobials',
  'Short-term use of broad-spectrum antimicrobials',
  'B',
  'Long-term broad-spectrum antimicrobial therapy destroys protective commensal flora, allowing opportunistic pathogens or resistant microbes to cause a superinfection.',
  'Microbiology & Superinfections',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000009',
  'What is the primary purpose of the WHO AWaRe classification of antibiotics?',
  'To classify antibiotics according to their colour',
  'To support antibiotic stewardship and monitor antibiotic use',
  'To classify antibiotics according to their manufacturing cost',
  'To identify antibiotics used exclusively in veterinary medicine',
  'B',
  'The WHO AWaRe (Access, Watch, Reserve) classification is designed to support antibiotic stewardship activities and monitor antibiotic consumption.',
  'Antimicrobial Stewardship & AWaRe',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000010',
  'Which statement about antimicrobial resistance is correct?',
  'Only patients who take antibiotics can carry resistant bacteria',
  'Resistance occurs only in hospitals',
  'AMR can spread between people, animals and the environment',
  'Antibiotic resistance affects only bacterial infections in adults',
  'C',
  'Antimicrobial resistance spreads dynamically between people, animals, food, and the environment under the One Health framework.',
  'One Health & Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000011',
  'Which of the following is not a type of β-lactam antimicrobial?',
  'Penicillins',
  'Glycopeptides',
  'Cephalosporins',
  'Monobactams',
  'B',
  'Glycopeptides (e.g., vancomycin) inhibit cell wall synthesis by binding to D-Ala-D-Ala, but they do not contain a beta-lactam ring.',
  'Pharmacology & Drug Classes',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000012',
  'In the Kirby-Bauer disk diffusion test, the _______ of the zone of inhibition is measured and used for interpretation.',
  'Diameter',
  'Microbial population',
  'Circumference',
  'Depth',
  'A',
  'The complete diameter of the zone of inhibition is measured in millimeters across the antimicrobial disk.',
  'Laboratory Diagnostics & AST',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000013',
  'Which of the following techniques cannot be used to determine the minimum inhibitory concentration of an antimicrobial drug against a particular microbe?',
  'Etest',
  'Microbroth dilution test',
  'Kirby-Bauer disk diffusion test',
  'Macrobroth dilution test',
  'C',
  'The Kirby-Bauer disk diffusion test is qualitative (categorizing into Susceptible, Intermediate, or Resistant) and cannot determine a quantitative MIC value.',
  'Laboratory Diagnostics & AST',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000014',
  'What happens when bacteria become resistant to antibiotics?',
  'Antibiotics become more effective.',
  'Antibiotics may no longer kill or inhibit bacterial growth effectively.',
  'Bacteria become viruses.',
  'Infection disappears automatically.',
  'B',
  'When bacteria develop resistance, standard concentrations of antibiotics can no longer kill them or effectively inhibit their growth.',
  'AMR Fundamentals',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000015',
  'What does the WHO AWaRe classification stand for?',
  'Access, Watch and Reserve',
  'Antibiotic, Water and Resistance',
  'Action, Warning and Response',
  'Access, Warning and Recovery',
  'A',
  'AWaRe stands for Access, Watch, and Reserve—the three core categories defining global antibiotic stewardship.',
  'Antimicrobial Stewardship & AWaRe',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000016',
  'MRSA stands for:',
  'Multiple Resistant Streptococcus Aureus',
  'Methicillin-Resistant Staphylococcus aureus',
  'Medical Resistant Staphylococcus Antibiotic',
  'Methicillin Reactive Staphylococcus aureus',
  'B',
  'MRSA stands for Methicillin-Resistant Staphylococcus aureus, resistant to beta-lactam antibiotics via the mecA gene.',
  'Priority Pathogens',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000017',
  'A patient forgets to take one dose of an antibiotic. What should the Pharmacy Officer advise?',
  'Take double the next dose.',
  'Stop the treatment.',
  'Follow the medicine-specific missed-dose instructions and avoid doubling doses.',
  'Take two different antibiotics.',
  'C',
  'Patients should follow medicine-specific missed-dose directions and never double their dose due to increased risk of toxicity and adverse effects.',
  'Rational Drug Use & Pharmacy Practice',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000018',
  'The Minimum Inhibitory Concentration (MIC) of an antibiotic is:',
  'Lowest concentration that kills all bacterial cells',
  'Lowest concentration that prevents visible bacterial growth',
  'Highest concentration tolerated by the patient',
  'Concentration that produces maximum bacterial growth inhibition in a patient',
  'B',
  'MIC is defined as the lowest concentration of an antimicrobial that prevents visible in vitro growth of the bacterium after overnight incubation.',
  'Laboratory Diagnostics & AST',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000019',
  'Should antibiotics be taken for a common cold?',
  'Always',
  'Only at night',
  'No, because common cold is usually caused by viruses.',
  'Yes, to prevent all future infections.',
  'C',
  'The common cold is caused by viruses, and antibiotics have no effect against viral infections.',
  'Rational Drug Use',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000020',
  'An isolate has an MIC of 2 mg/L. The applicable susceptibility breakpoints are S ≤ 1 mg/L, I = 2 mg/L and R ≥ 4 mg/L. How should the isolate be categorized?',
  'Susceptible',
  'Intermediate (I)',
  'Resistant',
  'Non-interpretable',
  'B',
  'Because the measured MIC of 2 mg/L matches the defined breakpoint (I = 2 mg/L), it is categorized as Intermediate.',
  'AST Interpretation & Breakpoints',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000021',
  'How can untreated hospital wastewater contribute to the spread of antimicrobial resistance?',
  'By eliminating all susceptible bacteria',
  'By releasing antibiotic residues, resistant bacteria and resistance genes into the environment',
  'By increasing dissolved oxygen in rivers',
  'By reducing microbial diversity in all aquatic ecosystems',
  'B',
  'Hospital wastewater contains antibiotic residues, multi-resistant pathogens, and resistance plasmids that contaminate natural water bodies.',
  'One Health & Environmental AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000022',
  'Which of the following is the most appropriate practice for unused or expired antibiotics?',
  'Dispose of them in household drains',
  'Flush them into toilets',
  'Follow authorised pharmaceutical take-back or biomedical/pharmaceutical waste disposal procedures',
  'Mix them with general household waste without segregation',
  'C',
  'Antibiotics should never be flushed down toilets or drains; they must be disposed of via authorized take-back schemes or biomedical waste protocols.',
  'Environmental AMR & Safe Disposal',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000023',
  'Which analytical technique is commonly used to detect and quantify specific antimicrobial resistance genes in environmental samples?',
  'ELISA',
  'Quantitative PCR (qPCR)',
  'Gram staining',
  'Haemocytometry',
  'B',
  'Quantitative Real-Time PCR (qPCR) is the primary molecular diagnostic technique used to detect and quantify antibiotic resistance genes (ARGs).',
  'Laboratory Diagnostics & Molecular Biology',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000024',
  'Which of the following is an important indicator of faecal contamination in wastewater?',
  'Escherichia coli',
  'Lactobacillus acidophilus',
  'Saccharomyces cerevisiae',
  'Rhizobium species',
  'A',
  'Escherichia coli is the globally recognized primary bacterial indicator of fecal contamination in water and wastewater.',
  'Microbiology & Environmental Surveillance',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000025',
  'Which process is most directly associated with the transfer of antimicrobial resistance genes between bacteria through direct cell-to-cell contact?',
  'Transformation',
  'Transduction',
  'Conjugation',
  'Binary fission',
  'C',
  'Conjugation is horizontal gene transfer mediated by a pilus through direct physical cell-to-cell contact.',
  'Resistance Genetics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000026',
  'A Pharmacy Officer is asked to recommend antibiotics for a patient with a viral upper respiratory tract infection. What is the most appropriate response?',
  'Recommend a broad-spectrum antibiotic',
  'Recommend a reserve antibiotic',
  'Explain that antibiotics do not treat viral infections and avoid unnecessary antibiotic use',
  'Recommend two antibiotics together',
  'C',
  'Antibiotics are ineffective against viral upper respiratory tract infections. The Pharmacy Officer should educate the patient on symptomatic relief.',
  'Rational Drug Use & Pharmacy Practice',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000027',
  'Which of the following can carry antibiotic resistance genes between bacterial cells?',
  'Plasmids',
  'Ribosomes',
  'Mitochondria',
  'Lysosomes',
  'A',
  'Plasmids are mobile extra-chromosomal DNA elements that frequently carry resistance genes and transfer between bacterial cells.',
  'Resistance Genetics',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000028',
  'How can the excessive use of antibiotics in humans contribute to antimicrobial resistance in aquatic ecosystems?',
  'Antibiotics and resistant bacteria can enter sewage through human excretion',
  'Antibiotics are completely destroyed inside the human body',
  'Antibiotic use increases oxygen concentration in rivers',
  'Antibiotics cannot enter wastewater',
  'A',
  'Unmetabolized antibiotics and resistant bacteria are excreted in human urine and feces, entering wastewater systems and selecting for resistance in aquatic environments.',
  'One Health & Environmental AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000029',
  'Which of the following microorganisms can develop antimicrobial resistance?',
  'Bacteria only',
  'Viruses only',
  'Bacteria, viruses, fungi and parasites',
  'Human cells',
  'C',
  'Antimicrobial resistance (AMR) encompasses bacteria (antibiotics), viruses (antivirals), fungi (antifungals), and parasites (antiprotozoals).',
  'AMR Fundamentals',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000030',
  'Which was the first antibiotic to be mass-produced on an industrial scale?',
  'Streptomycin',
  'Penicillin',
  'Tetracycline',
  'Chloramphenicol',
  'B',
  'Penicillin, discovered by Alexander Fleming, was the first antibiotic to be industrially mass-produced during World War II.',
  'History of Antibiotics',
  'easy'
)
ON CONFLICT (id) DO UPDATE SET
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
