-- ============================================================
-- AMR Quiz Portal - Seed Data (30 AMR MCQs + Sample Competition)
-- Migration: 003_seed_amr_data.sql
-- ============================================================

-- Insert 30 Specialized AMR & Microbiology Questions
INSERT INTO question_bank (id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty)
VALUES
(
  'b0000001-0000-0000-0000-000000000001',
  'What is the global campaign organized annually in November to raise awareness of antimicrobial resistance?',
  'World Health Day',
  'World Antimicrobial Awareness Week (WAAW)',
  'Global Antibiotic Prudence Month',
  'International Infection Control Day',
  'B',
  'World Antimicrobial Awareness Week (WAAW) is celebrated annually from 18 to 24 November.',
  'AMR General',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000002',
  'Which of the following is the primary mechanism of resistance in Methicillin-Resistant Staphylococcus aureus (MRSA)?',
  'Production of clavulanic acid-sensitive penicillinase',
  'Alteration of penicillin-binding protein to PBP2a encoded by mecA',
  'Efflux pump overexpression (MexAB-OprM)',
  'Porin channel closure',
  'B',
  'MRSA resistance is mediated by the mecA gene which encodes PBP2a, having low affinity for beta-lactams.',
  'Microbiology & Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000003',
  'The "One Health" approach integrates collaborative efforts across which disciplines?',
  'Human health, Animal health, and Environmental health',
  'Hospital pharmacy, Community pharmacy, and Industrial pharmacy',
  'Microbiology, Pathology, and Biochemistry',
  'Government hospitals, Private clinics, and NGOs',
  'A',
  'One Health recognizes that the health of people is intimately connected to the health of animals and our shared environment.',
  'One Health & Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000004',
  'Which gene is responsible for plasmid-mediated colistin resistance, first reported in 2015?',
  'blaNDM-1',
  'mcr-1',
  'vanA',
  'kpc-2',
  'B',
  'The mcr-1 gene mediates transferable resistance to polymyxins/colistin, a last-resort antibiotic.',
  'Resistance Genetics',
  'hard'
),
(
  'b0000001-0000-0000-0000-000000000005',
  'In the WHO AWaRe antibiotic categorization framework, which category includes antibiotics that should be kept as last-resort options?',
  'Access',
  'Watch',
  'Reserve',
  'Emergency',
  'C',
  'The Reserve group includes antibiotics and antibiotic classes that should be reserved for treatment of confirmed or suspected infections due to multi-drug-resistant organisms.',
  'Antimicrobial Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000006',
  'Extended-Spectrum Beta-Lactamases (ESBLs) typically confer resistance to which of the following?',
  'Only narrow-spectrum penicillins',
  'Penicillins, 1st, 2nd, and 3rd generation cephalosporins, and aztreonam',
  'Carbapenems only',
  'Macrolides and fluoroquinolones',
  'B',
  'ESBLs hydrolyze third-generation cephalosporins and aztreonam, but are inhibited by beta-lactamase inhibitors like clavulanic acid.',
  'Microbiology & Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000007',
  'Which of the following beta-lactamase inhibitors can inhibit Metallo-beta-lactamases (MBLs) like NDM-1?',
  'Clavulanic acid',
  'Sulbactam',
  'Avibactam',
  'None of the above (MBLs are not inhibited by classic or diazabicyclooctane inhibitors)',
  'D',
  'NDM and other MBLs require zinc for activity and are resistant to all commercially approved beta-lactamase inhibitors like clavulanate, tazobactam, and avibactam (though aztreonam often remains stable).',
  'Pharmacology & Therapeutics',
  'hard'
),
(
  'b0000001-0000-0000-0000-000000000008',
  'What does the acronym "ESKAPE" pathogens stand for in clinical microbiology?',
  'Escherichia, Salmonella, Klebsiella, Acinetobacter, Proteus, Enterobacter',
  'Enterococcus faecium, S. aureus, K. pneumoniae, A. baumannii, P. aeruginosa, Enterobacter spp.',
  'E. coli, Shigella, Klebsiella, Actinomyces, Pseudomonas, Enterococcus',
  'Epidermidis, Streptococcus, Klebsiella, Aspergillus, Pseudomonas, Entamoeba',
  'B',
  'ESKAPE pathogens represent leading multidrug-resistant nosocomial pathogens responsible for high mortality.',
  'Microbiology',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000009',
  'Which bacterial structure is altered in high-level fluoroquinolone resistance in Gram-negative bacteria?',
  'DNA Gyrase (gyrA) and Topoisomerase IV (parC)',
  '50S Ribosomal subunit (23S rRNA)',
  'Dihydropteroate synthase (DHPS)',
  'Peptidoglycan transpeptidase',
  'A',
  'Target gene mutations in gyrA and parC quinolone resistance-determining regions (QRDR) lead to fluoroquinolone resistance.',
  'Microbiology & Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000010',
  'What is the primary role of a Clinical Pharmacist in an Antimicrobial Stewardship Program (ASP)?',
  'Restricting all antibiotic purchases without physician consultation',
  'Dose optimization, de-escalation, IV-to-oral switch, and monitoring culture sensitivity reports',
  'Performing surgical wound debridement',
  'Manufacturing vaccines on site',
  'B',
  'Pharmacists optimize pharmacokinetics/pharmacodynamics (PK/PD), implement de-escalation, and guide antimicrobial choice.',
  'Antimicrobial Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000011',
  'Vancomycin resistance in VanA-type enterococci (VRE) occurs through the replacement of D-Ala-D-Ala with which peptidoglycan precursor?',
  'D-Ala-D-Lac',
  'D-Ala-D-Ser',
  'L-Lys-D-Ala',
  'D-Glu-D-Ala',
  'A',
  'VanA operon synthesizes cell-wall precursors ending in D-alanyl-D-lactate, reducing vancomycin binding affinity by ~1,000-fold.',
  'Resistance Genetics',
  'hard'
),
(
  'b0000001-0000-0000-0000-000000000012',
  'Which of the following is considered the MOST effective and cost-efficient measure to prevent nosocomial transmission of resistant bugs?',
  'Universal fumigation of wards twice daily',
  'Proper hand hygiene practice using alcohol-based rubs or soap',
  'Prophylactic broad-spectrum antibiotics to all ICU admissions',
  'Installing UV lamps in every hallway',
  'B',
  'Hand hygiene is recognized by WHO as the single most effective tool to halt pathogen transmission in healthcare.',
  'Infection Prevention & Control',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000013',
  'What is the definition of "Multidrug-Resistant" (MDR) bacteria according to international consensus (Magiorakos et al.)?',
  'Non-susceptibility to at least one agent in three or more antimicrobial categories',
  'Non-susceptibility to all antimicrobial agents except one or two categories',
  'Non-susceptibility to all agents in all antimicrobial categories',
  'Resistance to penicillin and erythromycin only',
  'A',
  'MDR is defined as acquired non-susceptibility to at least one agent in three or more antimicrobial categories.',
  'Microbiology',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000014',
  'What term refers to bacteria that are non-susceptible to ALL licensed antimicrobial agents?',
  'MDR (Multidrug-resistant)',
  'XDR (Extensively drug-resistant)',
  'PDR (Pan-drug resistant)',
  'SDR (Super drug-resistant)',
  'C',
  'PDR (Pan-drug resistant) bacteria exhibit non-susceptibility to all agents in all antimicrobial categories.',
  'Microbiology',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000015',
  'Which pharmacokinetic/pharmacodynamic (PK/PD) index best predicts the antibacterial efficacy of beta-lactam antibiotics?',
  'Peak concentration to MIC ratio (Cmax/MIC)',
  'Percentage of time the free drug concentration remains above MIC (% fT > MIC)',
  'Area under the curve to MIC ratio (AUC24/MIC)',
  'Volume of distribution (Vd)',
  'B',
  'Beta-lactams exhibit time-dependent bactericidal activity where efficacy correlates with % fT > MIC.',
  'Pharmacokinetics & Pharmacodynamics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000016',
  'Aminoglycosides (e.g., Gentamicin, Amikacin) exhibit which type of bactericidal killing pattern?',
  'Time-dependent killing (% fT > MIC)',
  'Concentration-dependent killing with post-antibiotic effect (Cmax/MIC)',
  'Non-saturable passive diffusion',
  'Bacteriostatic inhibition without concentration dependence',
  'B',
  'Aminoglycosides are concentration-dependent killers best monitored by Cmax/MIC and once-daily extended interval dosing.',
  'Pharmacokinetics & Pharmacodynamics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000017',
  'What is the common adverse effect of broad-spectrum antibiotic use that results from disruption of the normal gut microbiota?',
  'Clostridioides difficile-associated diarrhea (CDAD)',
  'Aplastic anemia',
  'Gouty arthritis',
  'Pulmonary fibrosis',
  'A',
  'Broad-spectrum antibiotics eliminate protective commensal flora, allowing toxigenic C. difficile proliferation.',
  'Clinical Pharmacy & Safety',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000018',
  'Which antibiotic class should be avoided in children and pregnant women due to cartilage damage and tooth discoloration, respectively?',
  'Penicillins and Macrolides',
  'Fluoroquinolones (arthropathy) and Tetracyclines (tooth staining)',
  'Cephalosporins and Carbapenems',
  'Monobactams and Lipopeptides',
  'B',
  'Fluoroquinolones cause tendinopathy/arthropathy in young animals; tetracyclines bind calcium causing permanent tooth discoloration.',
  'Pharmacotherapy & Toxicity',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000019',
  'What is "Antimicrobial De-escalation" in clinical pharmacy practice?',
  'Stopping all antibiotics after 24 hours regardless of symptoms',
  'Switching from an empiric broad-spectrum antibiotic to a narrower-spectrum agent once pathogen & sensitivities are known',
  'Reducing the price of antibiotics sold in hospital dispensaries',
  'Using half of the recommended dose to prevent toxicity',
  'B',
  'De-escalation narrows antibiotic spectrum based on culture results, minimizing selective pressure for resistance.',
  'Antimicrobial Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000020',
  'Which laboratory method is widely used in hospital microbiology to determine the Minimum Inhibitory Concentration (MIC) using a predefined gradient strip?',
  'Kirby-Bauer disc diffusion',
  'E-test (Epsilometer test)',
  'Gram stain smear',
  'Coagulase test',
  'B',
  'E-test is an agar diffusion technique that directly quantifies MIC using an antibiotic gradient impregnated plastic strip.',
  'Microbiology & Lab Diagnostics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000021',
  'What is the primary concern regarding over-the-counter (OTC) dispensing of antibiotics in community pharmacies?',
  'It promotes inappropriate use, under-dosing, incomplete courses, and drives community-acquired resistance',
  'It reduces government tax revenue on medicines',
  'It causes sudden depletion of hospital inventories',
  'It leads to excessive allergic reactions compared to prescription use',
  'A',
  'Non-prescription OTC sales promote rational misuse and sub-inhibitory dosing, accelerating resistance.',
  'Community Pharmacy & Policy',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000022',
  'Which biomarker is most frequently utilized in hospital antibiotic stewardship protocols to distinguish bacterial from viral respiratory infections?',
  'Alkaline phosphatase (ALP)',
  'Procalcitonin (PCT)',
  'Creatine kinase (CK-MB)',
  'Serum uric acid',
  'B',
  'Procalcitonin levels rise rapidly in systemic bacterial infections and remain low in viral infections, guiding initiation and discontinuation.',
  'Diagnostics & Stewardship',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000023',
  'Which of the following describes horizontal gene transfer (HGT) via bacteriophage viruses?',
  'Transformation',
  'Conjugation',
  'Transduction',
  'Electroporation',
  'C',
  'Transduction is the transfer of bacterial DNA from one bacterium to another via a bacteriophage.',
  'Resistance Genetics',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000024',
  'What is the mechanism of action of Daptomycin against resistant Gram-positive pathogens like MRSA and VRE?',
  'Inhibition of 30S ribosomal translation',
  'Binding to bacterial membrane causing rapid potassium efflux and membrane depolarization',
  'Inhibition of DNA-dependent RNA polymerase',
  'Competitive inhibition of folic acid synthesis',
  'B',
  'Daptomycin inserts into the bacterial cell membrane in a calcium-dependent manner, causing rapid depolarization and cell death.',
  'Pharmacology & Therapeutics',
  'hard'
),
(
  'b0000001-0000-0000-0000-000000000025',
  'Why is the use of sub-therapeutic antibiotic concentrations as growth promoters in animal agriculture discouraged globally?',
  'It makes meat unpalatable to humans',
  'It creates sustained selective pressure that fosters resistant zoonotic bacteria transmissible to humans',
  'It slows animal growth rates',
  'It destroys veterinary diagnostic equipment',
  'B',
  'Agricultural misuse fosters resistant strains (e.g., Salmonella, Campylobacter) that transfer to humans through food chains.',
  'One Health & Veterinary AMR',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000026',
  'What is an "Antibiogram" in hospital pharmacy and infectious disease practice?',
  'A patient bill for antibiotic medications',
  'A periodic institutional summary of antimicrobial susceptibilities of local bacterial isolates',
  'An ECG reading taken during antibiotic infusion',
  'A microscopic picture of an antibiotic molecule',
  'B',
  'A cumulative hospital antibiogram guides clinicians and pharmacists in empirical antibiotic selection based on local resistance patterns.',
  'Antimicrobial Stewardship',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000027',
  'Which of the following resistance mechanisms directly pumps antimicrobial molecules out of the bacterial cell?',
  'Enzymatic degradation',
  'Active multidrug efflux pumps (e.g., RND family)',
  'Target protection proteins',
  'Cell wall hyper-thickening',
  'B',
  'Efflux pumps actively extrude antibiotics from bacterial periplasm/cytoplasm, reducing intracellular drug concentrations.',
  'Microbiology & Resistance Mechanisms',
  'medium'
),
(
  'b0000001-0000-0000-0000-000000000028',
  'Which newly approved combination agent possesses activity against many carbapenem-resistant Enterobacterales producing KPC enzymes?',
  'Ampicillin-Sulbactam',
  'Ceftazidime-Avibactam',
  'Amoxicillin-Clavulanate',
  'Ticarcillin-Clavulanate',
  'B',
  'Ceftazidime-Avibactam overcomes class A (KPC) and class C carbapenemases and ESBLs.',
  'Pharmacology & Therapeutics',
  'hard'
),
(
  'b0000001-0000-0000-0000-000000000029',
  'What is the recommended duration of empiric antibiotic therapy before a formal "Antibiotic Time-out" / review should be conducted?',
  '12 hours',
  '48 to 72 hours',
  '14 days',
  '30 days',
  'B',
  'An antibiotic time-out at 48-72 hours reassesses necessity, dose, and spectrum once microbiological culture results arrive.',
  'Antimicrobial Stewardship',
  'easy'
),
(
  'b0000001-0000-0000-0000-000000000030',
  'Which of the following is true regarding viral upper respiratory tract infections (common cold, uncomplicated acute bronchitis)?',
  'They require 7 days of Azithromycin',
  'Antibiotics are ineffective and unnecessary, offering no clinical benefit and driving resistance',
  'They should always be treated with amoxicillin to prevent secondary bacterial infection',
  'Intravenous vancomycin is first line therapy',
  'B',
  'Viruses are unaffected by antibiotics; routine antibiotic use for uncomplicated viral infections accelerates AMR with zero patient benefit.',
  'Rational Drug Use',
  'easy'
)
ON CONFLICT (id) DO NOTHING;


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
  NOW() - INTERVAL '5 minutes',  -- Set ready for immediate testing or scheduled demo
  NOW() + INTERVAL '24 hours',
  600,
  30,
  18,
  1000
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  scheduled_start = EXCLUDED.scheduled_start,
  scheduled_end = EXCLUDED.scheduled_end;

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
