-- ============================================================
-- AMR Quiz Portal - Seed Data (32 AMR MCQs + Sample Competition)
-- Migration: 003_seed_amr_data.sql
-- ============================================================

-- Insert 32 Specialized AMR & Microbiology Questions
INSERT INTO question_bank (id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'What does AMR stand for in the context of global health?',
  'Antiviral Medication Response',
  'Advanced Medical Research',
  'Antibiotic Management and Regulation',
  'Antimicrobial Resistance',
  'D',
  'AMR stands for Antimicrobial Resistance, which occurs when bacteria, viruses, fungi, and parasites change over time and no longer respond to medicines.',
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
  'One Health is an integrated, unifying approach that aims to sustainably balance and optimize the health of people, animals, and ecosystems/environment.',
  'One Health & Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000003',
  'How many countries have developed AMR National Action Plans (NAPs) according to global health reports?',
  '170',
  '150',
  '160',
  '180',
  'A',
  'As per WHO and global tracking, 170 countries have developed National Action Plans (NAPs) aligned with the Global Action Plan on AMR.',
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
  'The WHO people-centred framework for addressing AMR in human health is built on 4 pillars: Prevention of infections; Access to essential health services; Timely and accurate diagnosis; and Appropriate, quality-assured treatment.',
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
  'Antibiotic resistance refers specifically to resistance in bacteria against antibiotics, whereas antimicrobial resistance (AMR) is a broader term encompassing bacteria, viruses, fungi, and parasites.',
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
  'Antimicrobial-resistant infections often lead to prolonged illness, increased hospital admissions, higher healthcare costs, and the need for second-line or last-resort medications with more severe side effects.',
  'Clinical Impact of AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000007',
  'Which of the following illnesses cannot be treated with antibiotics?',
  'Food poisoning (Salmonella)',
  'Influenza',
  'Chlamydia',
  'Urinary Tract Infection (E. coli)',
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
  'Long-term use of broad-spectrum antimicrobials disrupts normal protective microflora, allowing naturally resistant pathogens or opportunistic microbes (such as Clostridioides difficile or Candida) to overgrow and cause a superinfection.',
  'Microbiology & Superinfections',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000009',
  'Which clinical situation would be appropriate for treatment with a narrow-spectrum antimicrobial drug?',
  'Treatment of a polymicrobic mixed infection in the intestine',
  'Prophylaxis against infection after a surgical procedure',
  'Treatment of strep throat caused by culture identified Streptococcus pyogenes',
  'Empiric therapy of pneumonia while waiting for culture results',
  'C',
  'When the causative organism has been identified by culture and susceptibility testing (such as Streptococcus pyogenes), targeted narrow-spectrum therapy (e.g., penicillin) is the preferred standard of care to minimize collateral damage to normal microflora.',
  'Rational Drug Use & Prescribing',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000010',
  'Which of the following is not a type of β-lactam antimicrobial?',
  'Penicillins',
  'Glycopeptides',
  'Cephalosporins',
  'Monobactams',
  'B',
  'Glycopeptides (such as vancomycin and teicoplanin) inhibit cell wall synthesis by binding to D-Ala-D-Ala, but they do not contain a beta-lactam ring.',
  'Pharmacology & Drug Classes',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000011',
  'Which of the following resistance mechanisms describes the function of β-lactamase?',
  'Efflux pump',
  'Target mimicry',
  'Drug inactivation',
  'Target overproduction',
  'C',
  'Beta-lactamase enzymes hydrolyze the beta-lactam ring of the antibiotic, rendering it inactive before it can bind to penicillin-binding proteins (drug inactivation).',
  'Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000012',
  'Which of the following resistance mechanisms is commonly effective against a wide range of antimicrobials in multiple classes?',
  'Efflux pump',
  'Target mimicry',
  'Target modification',
  'Target overproduction',
  'A',
  'Multidrug efflux pumps (such as the RND family in Gram-negative bacteria) can actively pump out a wide variety of structurally diverse antimicrobials belonging to multiple antibiotic classes.',
  'Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000013',
  'In the Kirby-Bauer disk diffusion test, the _______ of the zone of inhibition is measured and used for interpretation.',
  'Diameter',
  'Microbial population',
  'Circumference',
  'Depth',
  'A',
  'In the standard Kirby-Bauer disk diffusion procedure, the diameter of the complete zone of inhibition is measured in millimeters using a ruler or caliper.',
  'Laboratory Diagnostics & AST',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000014',
  'Which of the following techniques cannot be used to determine the minimum inhibitory concentration of an antimicrobial drug against a particular microbe?',
  'Etest',
  'Microbroth dilution test',
  'Kirby-Bauer disk diffusion test',
  'Macrobroth dilution test',
  'C',
  'The Kirby-Bauer disk diffusion test is qualitative (categorizes as Susceptible, Intermediate, or Resistant) and does not directly provide a quantitative Minimum Inhibitory Concentration (MIC). In contrast, broth dilution and Etest provide exact MIC values.',
  'Laboratory Diagnostics & AST',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000015',
  'The utility of an antibiogram is that it shows antimicrobial susceptibility trends:',
  'Over a large geographic area.',
  'For an individual patient.',
  'In research laboratory strains.',
  'In a localized population.',
  'D',
  'A cumulative hospital or regional antibiogram summarizes the aggregate antimicrobial susceptibility profiles of common pathogens isolated in a specific healthcare facility or localized population over a defined period (usually one year).',
  'Surveillance & Antibiograms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000016',
  'New forms of drug-resistant bacteria can evolve quickly because bacteria often:',
  'Lack genetic variation, so any beneficial mutation spreads instantly to all cells',
  'Become drug-resistant only after exposure induces directed mutations specific to the antibiotic',
  'Have short generation times and can acquire resistance genes via horizontal gene transfer',
  'Rely primarily on meiosis, which rapidly creates novel resistant offspring each generation',
  'C',
  'Rapid bacterial replication (short generation times) combined with horizontal gene transfer (conjugation, transformation, and transduction) enables the swift emergence and dissemination of resistance genes.',
  'Microbiology & Genetics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000017',
  'MRSA stands for:',
  'Multiple Resistant Streptococcus Aureus',
  'Methicillin-Resistant Staphylococcus aureus',
  'Medical Resistant Staphylococcus Antibiotic',
  'Methicillin Reactive Staphylococcus aureus',
  'B',
  'MRSA stands for Methicillin-Resistant Staphylococcus aureus, a major pathogen resistant to beta-lactam antibiotics due to the acquisition of the mecA gene.',
  'Priority Pathogens',
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
  'MIC is defined as the lowest concentration of an antimicrobial agent that visibly inhibits the growth of the microorganism after overnight incubation.',
  'Laboratory Diagnostics & AST',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000019',
  'What is the meaning of selective pressure caused by antibiotic exposure?',
  'Antibiotics intentionally instruct all bacteria to develop resistance',
  'Susceptible bacteria are suppressed while resistant variants have a survival advantage',
  'All bacteria become equally susceptible after treatment',
  'Resistance genes are eliminated from every bacterial population',
  'B',
  'Selective pressure occurs when an antimicrobial kills or inhibits susceptible bacteria, allowing preexisting or newly mutated resistant strains to survive, multiply, and dominate the population.',
  'AMR Fundamentals',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000020',
  'An isolate has an MIC of 2 mg/L. The applicable susceptibility breakpoints are S ≤ 1 mg/L, I = 2 mg/L and R ≥ 4 mg/L. How should the isolate be categorized?',
  'Susceptible',
  'Intermediate (I)',
  'Resistant',
  'Non-interpretable',
  'B',
  'Since the measured MIC of 2 mg/L matches the defined intermediate breakpoint (I = 2 mg/L), the isolate is categorized as Intermediate.',
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
  'Hospital wastewater contains mixtures of active antibiotic residues, multiresistant bacteria, and mobile genetic elements, creating hotspots for environmental resistance dissemination and gene transfer.',
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
  'Flushing antibiotics or throwing them in drains contaminates water systems. Unused or expired antibiotics should be returned through authorized drug take-back schemes or disposed of via formal biomedical waste channels.',
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
  'Quantitative Real-Time PCR (qPCR) is the gold standard molecular technique for identifying and quantifying specific antibiotic resistance genes (ARGs) in clinical and environmental samples.',
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
  'Escherichia coli is a coliform bacterium inhabiting the gastrointestinal tract of warm-blooded animals, making it the globally accepted primary indicator of fecal contamination in water.',
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
  'Conjugation is the direct transfer of genetic material (often plasmids or transposons carrying resistance genes) between bacterial cells via a conjugation pilus (cell-to-cell contact).',
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
  'Antibiotics are ineffective against viral upper respiratory tract infections. A Pharmacy Officer should counsel the patient on symptomatic relief and explain why antibiotics are unnecessary and potentially harmful.',
  'Rational Drug Use & Pharmacy Practice',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000027',
  'Which method is most suitable for determining whether a bacterium is phenotypically resistant to a particular antibiotic?',
  'Antibiotic susceptibility testing',
  'Total dissolved solids measurement',
  'Turbidity measurement alone',
  'pH measurement',
  'A',
  'Antibiotic Susceptibility Testing (AST), performed via disk diffusion, broth microdilution, or automated systems, directly assesses the phenotypic susceptibility or resistance of bacteria to antimicrobial agents.',
  'Laboratory Diagnostics & AST',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000028',
  'Which of the following can carry antibiotic resistance genes between bacterial cells?',
  'Plasmids',
  'Ribosomes',
  'Mitochondria',
  'Lysosomes',
  'A',
  'Plasmids are extrachromosomal circular DNA molecules that frequently carry multiple antibiotic resistance genes and replicate independently, transferring easily across bacterial species.',
  'Resistance Genetics',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000029',
  'How can the excessive use of antibiotics in humans contribute to antimicrobial resistance in aquatic ecosystems?',
  'Antibiotics and resistant bacteria can enter sewage through human excretion',
  'Antibiotics are completely destroyed inside the human body',
  'Antibiotic use increases oxygen concentration in rivers',
  'Antibiotics cannot enter wastewater',
  'A',
  'A significant percentage of antibiotics consumed by humans are excreted un-metabolized or as active metabolites in urine and feces, entering wastewater systems and selecting for resistant bacteria in aquatic environments.',
  'One Health & Environmental AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000030',
  'Which of the following microorganisms can develop antimicrobial resistance?',
  'Bacteria only',
  'Viruses only',
  'Bacteria, viruses, fungi and parasites',
  'Human cells',
  'C',
  'Antimicrobial resistance (AMR) is a broad term encompassing bacteria (antibiotic resistance), viruses (antiviral resistance), fungi (antifungal resistance), and parasites (antiprotozoal/antihelminthic resistance).',
  'AMR Fundamentals',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000031',
  'Which was the first antibiotic to be mass-produced on an industrial scale?',
  'Streptomycin',
  'Penicillin',
  'Tetracycline',
  'Chloramphenicol',
  'B',
  'Penicillin, discovered by Alexander Fleming in 1928 and developed by Florey and Chain, was the first antibiotic to be successfully mass-produced on an industrial scale during World War II.',
  'History of Antibiotics',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000032',
  'In the WHO priority pathogens list for research and development of new antibiotics, which group is categorized with the highest (critical) priority?',
  'Drug-susceptible Streptococcus pneumoniae',
  'Penicillin-susceptible Staphylococcus aureus',
  'Carbapenem-resistant Acinetobacter baumannii, Pseudomonas aeruginosa, and Enterobacteriaceae',
  'Non-pathogenic skin flora Staphylococcus epidermidis',
  'C',
  'The WHO priority pathogens list designates Carbapenem-resistant Acinetobacter baumannii, Pseudomonas aeruginosa, and Carbapenem-resistant/ESBL-producing Enterobacteriaceae as Critical Priority (Priority 1) due to their severe threat and lack of treatment options.',
  'Priority Pathogens & Global Surveillance',
  'medium'
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
  'Sensitization of Future Practitioners - Pharmacy & Microbiology College Students. 32 MCQs, 10 Minutes. Compete for First, Second, Third Prize and earn digital verified certificates.',
  'scheduled',
  NOW() - INTERVAL '5 minutes',
  NOW() + INTERVAL '24 hours',
  600,
  32,
  18,
  1000
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  scheduled_start = EXCLUDED.scheduled_start,
  scheduled_end = EXCLUDED.scheduled_end,
  total_questions = EXCLUDED.total_questions;

-- Link all 32 questions to this competition
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
