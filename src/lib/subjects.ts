export type CurriculumCode = 'NSC' | 'ZIMSEC-OL' | 'ZIMSEC-AL' | 'CAM-IGCSE' | 'CAM-AL'

export interface Subject {
  id: string
  name: string
  icon: string
  color: string
  description: string
  curriculum: string         // human-readable label
  curriculumCode: CurriculumCode
  examStyle: string
  paperCodes?: string[]      // Cambridge paper codes e.g. ['0580']
}

export const CURRICULUM_META: Record<CurriculumCode, { label: string; shortLabel: string; flag: string; color: string }> = {
  'NSC':        { label: 'South Africa NSC',         shortLabel: 'NSC',           flag: '🇿🇦', color: '#16a34a' },
  'ZIMSEC-OL':  { label: 'ZIMSEC O-Level',           shortLabel: 'ZIMSEC O-Level',flag: '🇿🇼', color: '#dc2626' },
  'ZIMSEC-AL':  { label: 'ZIMSEC A-Level',           shortLabel: 'ZIMSEC A-Level',flag: '🇿🇼', color: '#b91c1c' },
  'CAM-IGCSE':  { label: 'Cambridge IGCSE',          shortLabel: 'IGCSE',         flag: '🎓', color: '#1d4ed8' },
  'CAM-AL':     { label: 'Cambridge AS & A Level',   shortLabel: 'A Level',       flag: '🎓', color: '#1e3a8a' },
}

// ─── South Africa NSC ─────────────────────────────────────────────────────────

const NSC: Subject[] = [
  { id: 'nsc-mathematics',        name: 'Mathematics',          icon: '∑',  color: '#4f46e5', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Algebra, calculus, geometry, statistics and probability',                 examStyle: 'Structured problems with full working required' },
  { id: 'nsc-physical-sciences',  name: 'Physical Sciences',    icon: '⚛',  color: '#0891b2', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Physics and Chemistry — mechanics, electricity, reactions',             examStyle: 'Multiple choice + structured questions' },
  { id: 'nsc-life-sciences',      name: 'Life Sciences',        icon: '🧬', color: '#059669', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Biology, ecology, genetics and evolution',                             examStyle: 'Structured essays and labelled diagrams' },
  { id: 'nsc-accounting',         name: 'Accounting',           icon: '📊', color: '#b45309', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Financial statements, bookkeeping, analysis, ethics',                  examStyle: 'Structured accounting problems and journals' },
  { id: 'nsc-business-studies',   name: 'Business Studies',     icon: '💼', color: '#0369a1', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Entrepreneurship, management, human resources, marketing',             examStyle: 'Essays and case study analysis' },
  { id: 'nsc-economics',          name: 'Economics',            icon: '📈', color: '#0e7490', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Micro and macroeconomics, development economics',                      examStyle: 'Essays and data response' },
  { id: 'nsc-computer-science',   name: 'Computer Applications Technology', icon: '💻', color: '#6d28d9', curriculumCode: 'NSC', curriculum: 'NSC', description: 'IT concepts, applications, social implications', examStyle: 'Theory and practical problems' },
  { id: 'nsc-agriculture',        name: 'Agricultural Sciences',icon: '🌾', color: '#65a30d', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Crop production, animal husbandry, soil science, agribusiness',       examStyle: 'Structured and practical' },
  { id: 'nsc-english',            name: 'English',              icon: '📚', color: '#dc2626', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Literature, language, writing, comprehension, transactional texts',   examStyle: 'Essays, comprehension and language questions' },
  { id: 'nsc-mathematics-literacy', name: 'Mathematical Literacy', icon: '🔢', color: '#7c3aed', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Real-world maths, finance, data handling, measurement',            examStyle: 'Contextual problems with realistic scenarios' },
  { id: 'nsc-geography',          name: 'Geography',            icon: '🌍', color: '#15803d', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Physical and human geography, map skills, geomorphology',             examStyle: 'Mapwork, essays and data interpretation' },
  { id: 'nsc-history',            name: 'History',              icon: '🏛️', color: '#92400e', curriculumCode: 'NSC', curriculum: 'NSC', description: 'South African and world history, source-based analysis',             examStyle: 'Source analysis and extended essays' },
  { id: 'nsc-isizulu',            name: 'isiZulu',              icon: '🌍', color: '#b91c1c', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Language, literature, oral communication, culture',                   examStyle: 'Essays, comprehension and language questions' },
  { id: 'nsc-afrikaans',          name: 'Afrikaans',            icon: '📖', color: '#1d4ed8', curriculumCode: 'NSC', curriculum: 'NSC', description: 'Language, literature, writing, comprehension',                       examStyle: 'Essays, comprehension and language questions' },
]

// ─── ZIMSEC O-Level ───────────────────────────────────────────────────────────

const ZIMSEC_OL: Subject[] = [
  { id: 'zol-mathematics',       name: 'Mathematics',           icon: '∑',  color: '#4f46e5', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Number, algebra, geometry, statistics and probability',               examStyle: 'Paper 1 (non-calculator short answer) + Paper 2 (structured problems)' },
  { id: 'zol-english-language',  name: 'English Language',      icon: '📝', color: '#dc2626', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Comprehension, composition, directed writing, language usage',        examStyle: 'Paper 1 (writing) + Paper 2 (comprehension and language)' },
  { id: 'zol-history',           name: 'History',               icon: '🏛️', color: '#92400e', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Zimbabwean, African and world history — source evaluation and essays', examStyle: 'Source-based paper + Essay paper' },
  { id: 'zol-geography',         name: 'Geography',             icon: '🌍', color: '#15803d', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Physical geography, human geography, mapwork — Zimbabwe focus',       examStyle: 'Paper 1 (physical) + Paper 2 (human + mapwork)' },
  { id: 'zol-biology',           name: 'Biology',               icon: '🧬', color: '#059669', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Cell biology, life processes, ecology, reproduction, genetics',       examStyle: 'Multiple choice + structured questions + essays' },
  { id: 'zol-chemistry',         name: 'Chemistry',             icon: '🧪', color: '#7c3aed', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Atomic structure, bonding, reactions, organic chemistry basics',      examStyle: 'Multiple choice + structured calculations and explanations' },
  { id: 'zol-physics',           name: 'Physics',               icon: '⚡', color: '#0891b2', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Mechanics, waves, electricity, magnetism, thermal physics',           examStyle: 'Multiple choice + structured problems with calculations' },
  { id: 'zol-combined-science',  name: 'Combined Science',      icon: '⚛',  color: '#0e7490', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Physics, Chemistry and Biology topics combined',                    examStyle: 'Multiple choice + structured questions across all three sciences' },
  { id: 'zol-accounts',          name: 'Accounts',              icon: '📊', color: '#b45309', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Double-entry bookkeeping, financial statements, trial balance',      examStyle: 'Structured accounting problems and ledgers' },
  { id: 'zol-commerce',          name: 'Commerce',              icon: '💼', color: '#0369a1', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Trade, business organisations, banking, insurance, marketing',      examStyle: 'Short answers + essays on business concepts' },
  { id: 'zol-agriculture',       name: 'Agriculture',           icon: '🌾', color: '#65a30d', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Crop production, livestock, soils, farm management in Zimbabwe context', examStyle: 'Theory paper + practical/field-based component' },
  { id: 'zol-computer-science',  name: 'Computer Science',      icon: '💻', color: '#6d28d9', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Programming, data representation, computer systems, networks',       examStyle: 'Theory paper + practical programming tasks' },
  { id: 'zol-shona',             name: 'Shona',                 icon: '🌍', color: '#b91c1c', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Shona language, literature, oral tradition, Zimbabwean culture',     examStyle: 'Comprehension + composition + prescribed literature texts' },
  { id: 'zol-ndebele',           name: 'Ndebele',               icon: '🌍', color: '#991b1b', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Ndebele language, literature, oral tradition, Zimbabwean culture',   examStyle: 'Comprehension + composition + prescribed literature texts' },
  { id: 'zol-technical-graphics', name: 'Technical Graphics',  icon: '📐', color: '#475569', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Engineering drawing, orthographic projection, isometric views',     examStyle: 'Drawing paper — precision and accuracy of technical drawings' },
  { id: 'zol-food-nutrition',    name: 'Food and Nutrition',    icon: '🍽️', color: '#d97706', curriculumCode: 'ZIMSEC-OL', curriculum: 'ZIMSEC O-Level', description: 'Nutrition science, food preparation, diet, health',                 examStyle: 'Theory paper + practical cooking examination' },
]

// ─── ZIMSEC A-Level ───────────────────────────────────────────────────────────

const ZIMSEC_AL: Subject[] = [
  { id: 'zal-pure-mathematics',  name: 'Pure Mathematics',      icon: '∫',  color: '#4338ca', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Algebra, calculus, trigonometry, vectors, complex numbers',         examStyle: 'Paper 1 + Paper 2 — extended structured problems, full working required' },
  { id: 'zal-statistics',        name: 'Statistics',            icon: '📉', color: '#0369a1', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Probability, distributions, hypothesis testing, regression',       examStyle: 'Applied maths paper — interpret and calculate statistical models' },
  { id: 'zal-physics',           name: 'Physics',               icon: '⚡', color: '#0891b2', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Mechanics, fields, waves, modern physics, nuclear physics',         examStyle: 'Paper 1 (structured) + Paper 2 (problems) + practical assessment' },
  { id: 'zal-chemistry',         name: 'Chemistry',             icon: '🧪', color: '#7c3aed', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Physical, inorganic and organic chemistry — advanced level',        examStyle: 'Theory paper + practical exam; show mechanisms and explain reactions' },
  { id: 'zal-biology',           name: 'Biology',               icon: '🧬', color: '#059669', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Cell biology, genetics, ecology, physiology — advanced depth',      examStyle: 'Essay paper + practical; extended responses expected' },
  { id: 'zal-history',           name: 'History',               icon: '🏛️', color: '#92400e', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Zimbabwe, African and world history — analytical depth required',   examStyle: 'Source-based paper + extended analytical essays (800–1000 words)' },
  { id: 'zal-geography',         name: 'Geography',             icon: '🌍', color: '#15803d', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Advanced physical and human geography, fieldwork, Zimbabwe case studies', examStyle: 'Structured data response + extended essays + fieldwork report' },
  { id: 'zal-economics',         name: 'Economics',             icon: '📈', color: '#0e7490', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Micro, macro, international economics and development economics',   examStyle: 'Data response + essays — evaluate policies and use models' },
  { id: 'zal-business-studies',  name: 'Business Studies',      icon: '💼', color: '#0369a1', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Strategy, operations, finance, HR, marketing — advanced level',    examStyle: 'Case study analysis + extended essays on business decisions' },
  { id: 'zal-accounting',        name: 'Accounting',            icon: '📊', color: '#b45309', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Advanced financial accounting, management accounting, audit',       examStyle: 'Multi-part structured questions — precision and presentation matter' },
  { id: 'zal-english-literature', name: 'English Literature',   icon: '📚', color: '#dc2626', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Prescribed texts, critical analysis, unseen poetry and prose',     examStyle: 'Unseen texts + prescribed text essays — literary analysis skills' },
  { id: 'zal-computer-science',  name: 'Computer Science',      icon: '💻', color: '#6d28d9', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Advanced programming, data structures, algorithms, systems',       examStyle: 'Theory paper + programming project or practical assessment' },
  { id: 'zal-agriculture',       name: 'Agriculture',           icon: '🌾', color: '#65a30d', curriculumCode: 'ZIMSEC-AL', curriculum: 'ZIMSEC A-Level', description: 'Agronomy, animal science, farm management, agricultural economics', examStyle: 'Theory paper + fieldwork/project — Zimbabwe farming context' },
]

// ─── Cambridge IGCSE ──────────────────────────────────────────────────────────

const CAM_IGCSE: Subject[] = [
  { id: 'igcse-mathematics',     name: 'Mathematics',           icon: '∑',  color: '#4f46e5', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0580'], description: 'Number, algebra, geometry, mensuration, statistics — Core and Extended', examStyle: 'Paper 1 (non-calc) + Paper 3/4 (extended structured) — show all working' },
  { id: 'igcse-add-maths',       name: 'Additional Mathematics',icon: '∫',  color: '#4338ca', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0606'], description: 'Advanced algebra, calculus, trigonometry, coordinate geometry',           examStyle: 'Two papers — all questions compulsory, pure maths rigour' },
  { id: 'igcse-english-lang',    name: 'English Language',      icon: '📝', color: '#dc2626', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0500','0522'], description: 'Reading comprehension, directed writing, composition',           examStyle: 'Structured reading + writing tasks — precision in language valued' },
  { id: 'igcse-english-lit',     name: 'English Literature',    icon: '📚', color: '#991b1b', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0486'], description: 'Poetry, prose and drama — analysis and personal response',              examStyle: 'Essay on prescribed texts + unseen poem analysis' },
  { id: 'igcse-physics',         name: 'Physics',               icon: '⚡', color: '#0891b2', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0625'], description: 'General Physics, Thermal, Waves, Electricity, Atomic — Core/Extended', examStyle: 'Multiple choice + structured + practical-based questions' },
  { id: 'igcse-chemistry',       name: 'Chemistry',             icon: '🧪', color: '#7c3aed', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0620'], description: 'States of matter, stoichiometry, organic, electrochemistry',            examStyle: 'Multiple choice + structured — define command words precisely' },
  { id: 'igcse-biology',         name: 'Biology',               icon: '🧬', color: '#059669', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0610'], description: 'Cells, nutrition, transport, respiration, genetics, ecology',          examStyle: 'Multiple choice + structured + extended response' },
  { id: 'igcse-combined-sci',    name: 'Co-ordinated Sciences', icon: '⚛',  color: '#0e7490', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0654'], description: 'Physics, Chemistry and Biology combined — double award',              examStyle: 'Multiple choice + structured papers across all three sciences' },
  { id: 'igcse-history',         name: 'History',               icon: '🏛️', color: '#92400e', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0470'], description: 'Modern world history + depth study options — source skills and essays', examStyle: 'Source-based paper (1 hour) + extended essays (1h45)' },
  { id: 'igcse-geography',       name: 'Geography',             icon: '🌍', color: '#15803d', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0460'], description: 'Population, settlement, environment, resources, plate tectonics',      examStyle: 'Structured data response + decision-making exercise' },
  { id: 'igcse-economics',       name: 'Economics',             icon: '📈', color: '#0e7490', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0455'], description: 'Micro and macroeconomics — supply/demand, markets, policy',           examStyle: 'Short answer + structured + data response' },
  { id: 'igcse-business',        name: 'Business Studies',      icon: '💼', color: '#0369a1', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0450'], description: 'Business activity, marketing, operations, finance, HR, ethics',       examStyle: 'Case study short answer + extended response' },
  { id: 'igcse-accounting',      name: 'Accounting',            icon: '📊', color: '#b45309', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0452'], description: 'Double-entry, financial statements, analysis — Core/Extended',        examStyle: 'Structured accounting problems — accuracy and layout matter' },
  { id: 'igcse-computer-sci',    name: 'Computer Science',      icon: '💻', color: '#6d28d9', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0478','0984'], description: 'Theory, algorithms, programming, data representation',          examStyle: 'Theory paper + written algorithm/pseudocode tasks' },
  { id: 'igcse-ict',             name: 'Information & Communication Technology', icon: '🖥️', color: '#5b21b6', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0417'], description: 'ICT applications, data handling, communications technology', examStyle: 'Theory paper + practical tasks (spreadsheet/database/presentation)' },
  { id: 'igcse-french',          name: 'French',                icon: '🇫🇷', color: '#1d4ed8', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0520'], description: 'Listening, reading, speaking and writing in French',               examStyle: 'Four separate skill papers — fluency and accuracy assessed' },
  { id: 'igcse-sociology',       name: 'Sociology',             icon: '🤝', color: '#0f766e', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0495'], description: 'Social structures, culture, inequality, research methods',           examStyle: 'Source-based + essays on sociological concepts' },
  { id: 'igcse-env-management',  name: 'Environmental Management', icon: '🌱', color: '#16a34a', curriculumCode: 'CAM-IGCSE', curriculum: 'Cambridge IGCSE', paperCodes: ['0680'], description: 'Natural resources, human impact, sustainability, ecosystems',       examStyle: 'Structured data-response + extended question' },
]

// ─── Cambridge AS & A Level ───────────────────────────────────────────────────

const CAM_AL: Subject[] = [
  { id: 'cal-mathematics',       name: 'Mathematics',           icon: '∑',  color: '#4f46e5', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9709'], description: 'Pure 1 & 2, Mechanics, Statistics — rigorous proof and application',   examStyle: 'AS: P1 + P2 or M1 or S1. A Level adds P3 + further applied; all working shown' },
  { id: 'cal-further-maths',     name: 'Further Mathematics',   icon: '∫',  color: '#3730a3', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9231'], description: 'Further pure maths, mechanics and statistics beyond standard A Level',  examStyle: 'Taken alongside standard A Level — harder proofs, complex topics' },
  { id: 'cal-physics',           name: 'Physics',               icon: '⚡', color: '#0891b2', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9702'], description: 'Mechanics, electric fields, waves, quantum, nuclear, practical skills',  examStyle: 'MCQ + structured + practical paper; evaluate and explain commands' },
  { id: 'cal-chemistry',         name: 'Chemistry',             icon: '🧪', color: '#7c3aed', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9701'], description: 'Physical, inorganic and organic chemistry with mechanistic understanding', examStyle: 'MCQ + structured theory + practical; predict and justify reactions' },
  { id: 'cal-biology',           name: 'Biology',               icon: '🧬', color: '#059669', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9700'], description: 'Cell biology, genetics, evolution, ecology, physiology — A Level depth',  examStyle: 'MCQ + structured + practical; extended prose answers expected' },
  { id: 'cal-history',           name: 'History',               icon: '🏛️', color: '#92400e', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9489'], description: 'Modern world and European history — critical source analysis and essays',  examStyle: 'Document-based paper + analytical essays; argue with evidence' },
  { id: 'cal-geography',         name: 'Geography',             icon: '🌍', color: '#15803d', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9696'], description: 'Physical systems, human processes, research methods, global themes',     examStyle: 'Structured + essay + fieldwork/research methods paper' },
  { id: 'cal-economics',         name: 'Economics',             icon: '📈', color: '#0e7490', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9708'], description: 'Advanced micro, macro, international trade, policy evaluation',           examStyle: 'Data response + essays — evaluate policy trade-offs with theory' },
  { id: 'cal-business',          name: 'Business',              icon: '💼', color: '#0369a1', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9609'], description: 'Strategy, operations, finance, HR, global business, change management',  examStyle: 'Case study short answer + extended essays on business decisions' },
  { id: 'cal-accounting',        name: 'Accounting',            icon: '📊', color: '#b45309', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9706'], description: 'Financial and management accounting, analysis, cost accounting',          examStyle: 'Structured multi-part questions — concepts, calculations, evaluation' },
  { id: 'cal-computer-science',  name: 'Computer Science',      icon: '💻', color: '#6d28d9', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9618'], description: 'Theory, OOP, data structures, algorithms, networking, databases',       examStyle: 'Theory paper + programming paper (any OOP language)' },
  { id: 'cal-english-language',  name: 'English Language',      icon: '📝', color: '#dc2626', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9093'], description: 'Directed writing, analysis, argument — advanced use of English',       examStyle: 'Paper 1: directed writing. Paper 2: text analysis; style and register' },
  { id: 'cal-english-literature',name: 'Literature in English', icon: '📚', color: '#991b1b', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9695'], description: 'Poetry, prose, drama — critical literary analysis and essay writing',   examStyle: 'Unseen + prescribed text essays; critical terminology and argument' },
  { id: 'cal-psychology',        name: 'Psychology',            icon: '🧠', color: '#be185d', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9990'], description: 'Approaches, research methods, core studies, options (e.g. criminology)', examStyle: 'Core studies paper + methods paper + options essay; evaluate evidence' },
  { id: 'cal-sociology',         name: 'Sociology',             icon: '🤝', color: '#0f766e', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9699'], description: 'Theory, culture, identity, stratification, research methods',           examStyle: 'Structured + extended essays; apply theoretical perspectives' },
  { id: 'cal-law',               name: 'Law',                   icon: '⚖️', color: '#374151', curriculumCode: 'CAM-AL', curriculum: 'Cambridge A Level', paperCodes: ['9084'], description: 'Sources of law, criminal law, contract law, tort — English legal system', examStyle: 'Problem questions + essays; IRAC structure expected' },
]

// ─── Combined export ──────────────────────────────────────────────────────────

export const SUBJECTS: Subject[] = [...NSC, ...ZIMSEC_OL, ...ZIMSEC_AL, ...CAM_IGCSE, ...CAM_AL]

export const SUBJECTS_BY_CURRICULUM: Record<CurriculumCode, Subject[]> = {
  'NSC':        NSC,
  'ZIMSEC-OL':  ZIMSEC_OL,
  'ZIMSEC-AL':  ZIMSEC_AL,
  'CAM-IGCSE':  CAM_IGCSE,
  'CAM-AL':     CAM_AL,
}

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find(s => s.id === id)
}
