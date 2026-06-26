// Zimbabwe curriculum knowledge base for the Compass AI companion.
// Covers ZIMSEC O-Level and A-Level subjects with topics, exam formats,
// Zimbabwe-specific context, and resource links.
// Syllabus PDFs are stored in public/knowledge/syllabuses/

export interface CurriculumTopic {
  name: string
  subtopics: string[]
  zimbabweContext?: string
}

export interface ExamPaper {
  code: string
  name: string
  duration: string
  marks: number
  format: string
}

export interface SubjectCurriculum {
  subjectId: string
  syllabusCode: string
  level: 'O-Level' | 'A-Level'
  curriculum: 'ZIMSEC' | 'Cambridge' | 'NSC'
  topics: CurriculumTopic[]
  examPapers: ExamPaper[]
  keyFormulas?: string[]
  studyTips: string[]
  syllabusFile?: string
  pastPapers: { source: string; url: string }[]
}

// ─── ZIMSEC O-Level ───────────────────────────────────────────────────────────

const ZOL_MATHEMATICS: SubjectCurriculum = {
  subjectId: 'zol-mathematics',
  syllabusCode: '4004/4030',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Mathematics_Syllabus.pdf',
  topics: [
    {
      name: 'Number',
      subtopics: ['Types of numbers (natural, integers, rational, irrational, real)', 'HCF and LCM', 'BODMAS/BEDMAS order of operations', 'Fractions, decimals and percentages', 'Standard form (scientific notation)', 'Indices and surds', 'Ratio and proportion', 'Approximation and estimation', 'Number bases (binary, octal, hexadecimal)'],
      zimbabweContext: 'Number skills are applied in everyday Zimbabwean contexts: exchange rates (USD/ZWG), market pricing, land measurements in hectares.',
    },
    {
      name: 'Algebra',
      subtopics: ['Simplification of algebraic expressions', 'Factorisation — common factor, difference of squares, quadratic trinomials', 'Equations — linear, simultaneous, quadratic', 'Inequalities and number lines', 'Changing the subject of formulae', 'Sequences and nth term — arithmetic and geometric'],
    },
    {
      name: 'Graphs and Functions',
      subtopics: ['Cartesian coordinates', 'Straight line graphs y=mx+c', 'Gradient and y-intercept', 'Quadratic graphs (parabola)', 'Cubic, reciprocal and exponential graphs', 'Kinematics — distance-time and velocity-time graphs', 'Solving equations graphically'],
    },
    {
      name: 'Geometry',
      subtopics: ['Angles — at a point, on a line, in polygons', 'Angle properties of parallel lines (alternate, corresponding, co-interior)', 'Triangles — congruence and similarity', 'Quadrilaterals and polygons', 'Circle theorems — chord, tangent, angle in segment, cyclic quadrilateral', 'Geometric constructions using compass and ruler'],
      zimbabweContext: 'Geometry is relevant in architecture, traditional Zimbabwean hut construction (circular plans), and land surveying.',
    },
    {
      name: 'Mensuration',
      subtopics: ['Perimeter and area of 2D shapes (triangle, rectangle, circle, sector)', 'Surface area and volume of 3D shapes (cuboid, cylinder, cone, sphere, pyramid)', 'Arc length and area of sector', 'Compound shapes'],
      zimbabweContext: 'Mensuration is applied in farming (area of fields in hectares), construction, and water tank volume calculations — all relevant in Zimbabwe.',
    },
    {
      name: 'Trigonometry',
      subtopics: ['SOH-CAH-TOA in right-angled triangles', 'Angles of elevation and depression', 'Sine rule and cosine rule for any triangle', 'Area of a triangle using ½absinC', 'Three-dimensional trigonometry', 'Bearings and navigation'],
      zimbabweContext: 'Bearings are tested using Zimbabwe landmarks. Trigonometry applies to surveying in farming regions like Mashonaland.',
    },
    {
      name: 'Statistics and Probability',
      subtopics: ['Data collection — population, sample, types of data', 'Frequency distributions — grouped and ungrouped', 'Mean, median, mode for raw and grouped data', 'Range and interquartile range', 'Frequency polygons, histograms, cumulative frequency curves (ogives)', 'Box-and-whisker plots', 'Scatter diagrams and lines of best fit', 'Probability — single events, combined events, tree diagrams'],
      zimbabweContext: 'Statistics are contextualised with Zimbabwe data: crop yields, rainfall patterns (Harare vs Bulawayo), population census figures.',
    },
    {
      name: 'Vectors',
      subtopics: ['Column vector notation', 'Vector addition and subtraction', 'Scalar multiplication', 'Position vectors', 'Magnitude of a vector', 'Parallel vectors and collinear points', 'Vector proofs in geometry'],
    },
    {
      name: 'Matrices and Transformations',
      subtopics: ['Matrix order, addition and subtraction', 'Matrix multiplication', 'Determinant of 2×2 matrix', 'Inverse matrix', 'Solving simultaneous equations using matrices', 'Transformations — translation, reflection, rotation, enlargement', 'Combined transformations', 'Matrices representing transformations'],
    },
  ],
  examPapers: [
    { code: '4004/1', name: 'Paper 1 — Non-Calculator', duration: '2 hours', marks: 80, format: 'Short structured questions; all compulsory; show all working' },
    { code: '4004/2', name: 'Paper 2 — Calculator Allowed', duration: '2 hours 30 minutes', marks: 100, format: 'Longer structured questions; some choice in later sections; full working required' },
  ],
  keyFormulas: [
    'Quadratic formula: x = (−b ± √(b²−4ac)) / 2a',
    'Area of triangle: ½base×height or ½absinC',
    'Sine rule: a/sinA = b/sinB = c/sinC',
    'Cosine rule: a² = b² + c² − 2bc·cosA',
    'Volume of cylinder: πr²h; Volume of cone: ⅓πr²h; Volume of sphere: ⁴⁄₃πr³',
    'Arc length: (θ/360)×2πr; Sector area: (θ/360)×πr²',
    'Distance formula: √((x₂−x₁)²+(y₂−y₁)²)',
    'Gradient: m = (y₂−y₁)/(x₂−x₁)',
  ],
  studyTips: [
    'Always show full working — method marks are awarded even if the final answer is wrong.',
    'Learn which questions require a calculator (Paper 2 only) vs mental/written methods (Paper 1).',
    'Practice drawing accurate graphs using a sharp pencil and ruler.',
    'Circle theorem questions often combine multiple theorems — identify all relevant properties.',
    'For statistics, always state the formula before substituting values.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'Zambuko', url: 'https://zambuko.vercel.app/zimsec' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_PHYSICS: SubjectCurriculum = {
  subjectId: 'zol-physics',
  syllabusCode: '4040',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Physics_Forms3-4.pdf',
  topics: [
    {
      name: 'Measurements',
      subtopics: ['SI units and prefixes', 'Measuring length, mass, time, temperature', 'Scalar and vector quantities', 'Accuracy, precision and significant figures', 'Measuring instruments — vernier caliper, micrometer, balance'],
    },
    {
      name: 'Forces and Motion',
      subtopics: ['Speed, velocity and acceleration', 'Equations of uniformly accelerated motion (v=u+at, s=ut+½at², v²=u²+2as)', 'Distance-time and velocity-time graphs', 'Newton\'s three laws of motion', 'Mass, weight and gravitational field strength (g=10 N/kg)', 'Friction — static and kinetic', 'Momentum and impulse', 'Conservation of momentum', 'Projectile motion'],
      zimbabweContext: 'Newton\'s laws are illustrated with examples like a vehicle braking on a dirt road (Zimbabwean context) or cattle pulling a cart.',
    },
    {
      name: 'Moments, Pressure and Density',
      subtopics: ['Moment of a force, principle of moments', 'Centre of gravity and stability', 'Pressure in solids (P=F/A)', 'Pressure in liquids (P=ρgh)', 'Archimedes\' principle and upthrust', 'Atmospheric pressure', 'Density and relative density'],
    },
    {
      name: 'Energy, Work and Power',
      subtopics: ['Work done (W=Fd)', 'Kinetic energy (Ek=½mv²)', 'Gravitational potential energy (Ep=mgh)', 'Elastic potential energy', 'Conservation of energy', 'Power (P=W/t)', 'Efficiency of machines', 'Sources of energy in Zimbabwe — Kariba Dam hydroelectric, solar, fossil fuels'],
      zimbabweContext: 'Zimbabwe\'s energy context: Kariba Dam provides hydroelectric power; load shedding due to energy shortages is a national issue. Solar energy is growing rapidly in rural Zimbabwe.',
    },
    {
      name: 'Thermal Physics',
      subtopics: ['Temperature scales — Celsius and Kelvin', 'Thermometers and their properties', 'Thermal expansion of solids, liquids, gases', 'Heat capacity and specific heat capacity', 'Latent heat — fusion and vaporisation', 'Conduction, convection, radiation', 'Practical applications: cooking, building design'],
    },
    {
      name: 'Waves',
      subtopics: ['Properties of waves — amplitude, wavelength, frequency, period, speed', 'Transverse and longitudinal waves', 'Wave equation (v=fλ)', 'Reflection, refraction, diffraction', 'Light — reflection and laws of reflection', 'Refraction — Snell\'s law and refractive index', 'Total internal reflection and critical angle', 'Lenses — converging and diverging, ray diagrams', 'Sound — properties, speed in different media, echo'],
    },
    {
      name: 'Electricity and Magnetism',
      subtopics: ['Electric charge — static, charging by friction and induction', 'Current, voltage and resistance (Ohm\'s Law)', 'Series and parallel circuits', 'Power and energy in electric circuits (P=IV, E=Pt)', 'Resistivity and resistance calculation', 'Potential dividers', 'Capacitors — basic idea', 'Magnetic fields — permanent magnets, field patterns', 'Electromagnets', 'Force on a current-carrying conductor (F=BIL)', 'Motors and generators', 'Electromagnetic induction — Faraday\'s law', 'Transformers'],
    },
    {
      name: 'Electronics',
      subtopics: ['Diodes and rectification (half-wave, full-wave)', 'Transistors as switches and amplifiers', 'Logic gates — AND, OR, NOT, NAND, NOR, XOR', 'Truth tables', 'Basic digital circuits'],
    },
    {
      name: 'Nuclear Physics',
      subtopics: ['Atomic structure — nucleus, proton, neutron, electron', 'Isotopes', 'Radioactivity — alpha, beta, gamma radiation', 'Properties and penetrating power of radiation', 'Equations for nuclear reactions', 'Half-life and radioactive decay', 'Background radiation', 'Uses and hazards of radioactivity', 'Nuclear fission and fusion'],
    },
  ],
  examPapers: [
    { code: '4040/1', name: 'Paper 1 — Multiple Choice', duration: '1 hour', marks: 40, format: '40 multiple choice questions — all compulsory' },
    { code: '4040/2', name: 'Paper 2 — Structured', duration: '1 hour 45 minutes', marks: 80, format: 'Structured questions; show all working; last question often extended response' },
  ],
  keyFormulas: [
    'v = u + at; s = ut + ½at²; v² = u² + 2as',
    'F = ma; W = mg; P = mv (momentum)',
    'W = Fd; Ek = ½mv²; Ep = mgh; P = W/t',
    'ρ = m/V; P = F/A; P = ρgh',
    'v = fλ; n = sin i/sin r (Snell\'s law)',
    'V = IR; P = IV = I²R = V²/R',
    'F = BIL; V_s/V_p = N_s/N_p (transformer)',
  ],
  studyTips: [
    'Draw clear, labelled diagrams — especially for ray optics, circuits, and field patterns.',
    'Memorise all formulae but also understand when to apply each one.',
    'In circuit calculations, always identify series vs parallel before applying rules.',
    'Kariba Dam is the standard Zimbabwe example for hydroelectric energy questions.',
    'For nuclear decay equations, ensure atomic number and mass number both balance.',
  ],
  pastPapers: [
    { source: 'Zimsake — Physics Green Book 2015-2019', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_CHEMISTRY: SubjectCurriculum = {
  subjectId: 'zol-chemistry',
  syllabusCode: '4007',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  topics: [
    {
      name: 'Atomic Structure',
      subtopics: ['Sub-atomic particles — proton, neutron, electron; masses and charges', 'Atomic number, mass number, isotopes', 'Electronic configuration (shells 2,8,8,2)', 'Ions — formation of cations and anions'],
    },
    {
      name: 'Chemical Bonding',
      subtopics: ['Ionic bonding — electron transfer, lattice structure', 'Covalent bonding — electron sharing, single, double, triple bonds', 'Metallic bonding', 'Properties arising from bond types', 'Simple molecular vs giant structures'],
    },
    {
      name: 'States of Matter',
      subtopics: ['Kinetic particle theory of solids, liquids, gases', 'Changes of state — melting, boiling, condensation, sublimation', 'Diffusion in liquids and gases', 'Brownian motion'],
    },
    {
      name: 'Stoichiometry',
      subtopics: ['Relative atomic and molecular masses (Ar, Mr)', 'Mole concept and Avogadro\'s number', 'Empirical and molecular formulae', 'Molar volume of gas at STP (22.4 dm³/mol)', 'Calculations from chemical equations'],
    },
    {
      name: 'Chemical Reactions',
      subtopics: ['Types of reaction — synthesis, decomposition, displacement, double decomposition', 'Rates of reaction — factors: temperature, concentration, surface area, catalyst', 'Energy changes — exothermic and endothermic', 'Reversible reactions and equilibrium', 'Le Chatelier\'s principle'],
    },
    {
      name: 'Acids, Bases and Salts',
      subtopics: ['Properties of acids and bases', 'pH scale and indicators', 'Neutralisation reactions', 'Preparation of soluble and insoluble salts', 'Titration calculations', 'Hydrolysis of salts'],
      zimbabweContext: 'Soil pH is crucial in Zimbabwean agriculture — farmers use lime (calcium carbonate) to neutralise acidic soils in the Highveld.',
    },
    {
      name: 'Electrochemistry',
      subtopics: ['Electrolysis — electrode reactions at anode (oxidation) and cathode (reduction)', 'Electrolysis of molten and aqueous solutions', 'Electroplating and its applications', 'Industrial applications — extraction of aluminium, chlorine and sodium hydroxide'],
    },
    {
      name: 'The Periodic Table',
      subtopics: ['Arrangement by atomic number and electron configuration', 'Periods and groups — trends in properties', 'Group I (alkali metals) — reactions with water, oxygen, halogens', 'Group VII (halogens) — reactivity trend', 'Transition metals — properties, uses, coloured compounds'],
    },
    {
      name: 'Metals and the Reactivity Series',
      subtopics: ['Reactivity series: K > Na > Ca > Mg > Al > Zn > Fe > Ni > Sn > Pb > H > Cu > Ag > Au', 'Reactions of metals with water, acids, oxygen', 'Displacement reactions', 'Extraction of metals — blast furnace (iron), electrolysis (aluminium)', 'Corrosion and prevention'],
      zimbabweContext: 'Zimbabwe is one of the world\'s top chrome and platinum producers. The extraction of metals from ores is directly relevant to Zimbabwe\'s mining industry (Great Dyke).',
    },
    {
      name: 'Carbon and Organic Chemistry',
      subtopics: ['Allotropes of carbon — diamond, graphite, fullerenes', 'Hydrocarbons — alkanes, alkenes', 'Combustion of fuels', 'Fractional distillation of petroleum', 'Addition and substitution reactions', 'Alcohols, carboxylic acids, esters', 'Polymers — addition and condensation polymerisation'],
    },
    {
      name: 'Water and Industrial Chemistry',
      subtopics: ['Water purification — sedimentation, filtration, chlorination (used by ZINWA)', 'Hard and soft water — temporary and permanent hardness', 'Haber process for ammonia synthesis (N₂ + 3H₂ ⇌ 2NH₃)', 'Ostwald process for nitric acid', 'Contact process for sulfuric acid'],
      zimbabweContext: 'ZINWA (Zimbabwe National Water Authority) manages water treatment. The Haber process products (fertilisers) are used in Zimbabwean commercial farming.',
    },
  ],
  examPapers: [
    { code: '4007/1', name: 'Paper 1 — Multiple Choice', duration: '1 hour', marks: 40, format: '40 MCQ questions' },
    { code: '4007/2', name: 'Paper 2 — Structured', duration: '1 hour 45 minutes', marks: 80, format: 'Structured questions requiring equations, calculations, and explanations' },
  ],
  studyTips: [
    'Learn the reactivity series off by heart — many questions depend on it.',
    'For electrolysis: remember OILRIG (Oxidation Is Loss, Reduction Is Gain).',
    'Balance all chemical equations — marks are lost for unbalanced equations.',
    'State symbols (s), (l), (g), (aq) should be included in equations.',
    'Learn to write ionic equations for displacement and neutralisation reactions.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_BIOLOGY: SubjectCurriculum = {
  subjectId: 'zol-biology',
  syllabusCode: '4047',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Biology.pdf',
  topics: [
    {
      name: 'Cell Biology',
      subtopics: ['Cell theory', 'Plant vs animal cells — structures and functions', 'Organelles: nucleus, mitochondria, chloroplast, ribosomes, vacuole, cell wall, cell membrane', 'Microscopy — magnification = image/actual size', 'Diffusion, osmosis and active transport', 'Cell division — mitosis and meiosis'],
    },
    {
      name: 'Nutrition in Plants',
      subtopics: ['Photosynthesis equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'Factors affecting rate of photosynthesis — light, CO₂, temperature, water', 'Leaf structure and adaptations for photosynthesis', 'Mineral nutrition — N, P, K, Mg deficiency symptoms', 'Testing leaves for starch'],
      zimbabweContext: 'Photosynthesis in the context of Zimbabwean crops: maize (mealies), tobacco, soyabean. Mineral deficiencies in communal farming soils.',
    },
    {
      name: 'Nutrition in Animals (Humans)',
      subtopics: ['Food groups and balanced diet', 'Enzymes — structure, specificity, factors affecting activity', 'Digestion in the alimentary canal', 'Absorption in the small intestine', 'Role of the liver', 'Malnutrition — kwashiorkor, marasmus, obesity'],
      zimbabweContext: 'Malnutrition is a real issue in some parts of Zimbabwe; kwashiorkor occurs when there is protein deficiency. Traditional Zimbabwean diet (sadza, vegetables, nyama) can be analysed.',
    },
    {
      name: 'Transport',
      subtopics: ['Blood — components and functions (red cells, white cells, platelets, plasma)', 'The heart — structure, double circulation, cardiac cycle', 'Blood vessels — arteries, veins, capillaries', 'Lymphatic system', 'Transport in plants — xylem (water) and phloem (sugars)', 'Transpiration — factors and significance'],
    },
    {
      name: 'Respiration',
      subtopics: ['Aerobic respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy (ATP)', 'Anaerobic respiration — lactic acid (animals), ethanol + CO₂ (yeast/fermentation)', 'Breathing mechanism — inhalation and exhalation', 'Gas exchange in alveoli'],
    },
    {
      name: 'Excretion',
      subtopics: ['Excretory organs and products — lungs (CO₂), skin (sweat), liver (bile), kidneys (urine)', 'Kidney structure — nephron, filtration, reabsorption, osmoregulation', 'Urea formation in liver from amino acid deamination'],
    },
    {
      name: 'Homeostasis',
      subtopics: ['Blood glucose regulation — insulin and glucagon', 'Temperature regulation — sweating, vasoconstriction, shivering', 'Osmoregulation by kidneys — ADH', 'Negative feedback concept'],
    },
    {
      name: 'Coordination and Response',
      subtopics: ['Nervous system — CNS (brain, spinal cord) and PNS', 'Neurones — sensory, motor, relay', 'Reflex arc', 'Synapse and neurotransmitters', 'Sense organs — eye and ear', 'Endocrine system — hormones and their roles', 'Plant tropisms — phototropism, gravitropism, auxins'],
    },
    {
      name: 'Reproduction',
      subtopics: ['Asexual reproduction — binary fission, budding, vegetative propagation (cuttings, grafting common in Zimbabwe horticulture)', 'Sexual reproduction in flowering plants — pollination, fertilisation, seed dispersal', 'Human reproductive system — male and female anatomy', 'Fertilisation, pregnancy and birth', 'Sexually transmitted infections — HIV/AIDS, gonorrhoea, syphilis'],
      zimbabweContext: 'Zimbabwe has one of the highest HIV/AIDS awareness levels in Africa due to decades of national campaigns. HIV/AIDS is always included in ZIMSEC Biology.',
    },
    {
      name: 'Genetics and Inheritance',
      subtopics: ['DNA structure — double helix, base pairing (A-T, C-G)', 'Genes, alleles, chromosomes', 'Dominant and recessive alleles', 'Monohybrid cross — Punnett squares', 'Genotype vs phenotype', 'Sex determination — XX (female), XY (male)', 'Sex-linked characteristics (e.g., colour blindness, haemophilia)', 'Mutations — causes and effects'],
    },
    {
      name: 'Ecology and Environment',
      subtopics: ['Ecosystems, habitats, populations, communities', 'Food chains and food webs', 'Energy flow and energy pyramids', 'Carbon cycle', 'Nitrogen cycle', 'Water cycle', 'Human impact — deforestation, pollution, habitat destruction', 'Conservation in Zimbabwe — national parks: Hwange, Gonarezhou, Mana Pools'],
      zimbabweContext: 'Zimbabwe\'s national parks are biodiversity hotspots: Hwange (elephants, lions), Mana Pools (UNESCO), Gonarezhou. Deforestation for charcoal (used for cooking in urban areas) is a real environmental issue.',
    },
  ],
  examPapers: [
    { code: '4047/1', name: 'Paper 1 — Multiple Choice', duration: '45 minutes', marks: 30, format: '30 MCQ questions' },
    { code: '4047/2', name: 'Paper 2 — Structured', duration: '1 hour 45 minutes', marks: 80, format: 'Structured and extended response questions; diagrams required' },
  ],
  studyTips: [
    'Draw fully labelled diagrams — the heart, kidney nephron, leaf cross-section are frequently tested.',
    'Learn all the biochemical equations (photosynthesis, aerobic and anaerobic respiration) by heart.',
    'For genetics questions, always draw a clear Punnett square and state all genotypes.',
    'HIV/AIDS questions regularly appear — know the modes of transmission and prevention.',
    'Zimbabwe\'s national parks (Hwange, Mana Pools, Gonarezhou) are the go-to examples for conservation.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_COMBINED_SCIENCE: SubjectCurriculum = {
  subjectId: 'zol-combined-science',
  syllabusCode: '4011',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Combined_Science.pdf',
  topics: [
    { name: 'Biology Section', subtopics: ['Cell biology and microscopy', 'Nutrition and digestion', 'Transport systems', 'Respiration', 'Reproduction', 'Genetics — basic Mendelian inheritance', 'Ecology and conservation'], zimbabweContext: 'Zimbabwe national parks and HIV/AIDS are standard context questions.' },
    { name: 'Chemistry Section', subtopics: ['Atomic structure and the Periodic Table', 'Chemical bonding (ionic and covalent)', 'Acids, bases and salts', 'Metals and reactivity series', 'Rates of reaction', 'Carbon compounds — fuels and polymers'], zimbabweContext: 'Metal extraction links to Zimbabwe\'s mining (gold, chrome, platinum).' },
    { name: 'Physics Section', subtopics: ['Forces and motion', 'Energy — forms, transformations, conservation', 'Electricity — circuits, current, voltage', 'Waves — light and sound', 'Heat — conduction, convection, radiation'], zimbabweContext: 'Kariba Dam hydroelectric power; solar energy in rural Zimbabwe.' },
  ],
  examPapers: [
    { code: '4011/1', name: 'Paper 1 — Multiple Choice', duration: '1 hour', marks: 40, format: '40 MCQ across Biology, Chemistry, Physics' },
    { code: '4011/2', name: 'Paper 2 — Structured', duration: '1 hour 45 minutes', marks: 80, format: 'Structured questions from all three sciences' },
  ],
  studyTips: [
    'Combined Science covers a wide range — make separate notes for each of the three sciences.',
    'Practise drawing diagrams quickly — the heart, circuit diagrams, and atomic models are common.',
    'Questions are at a slightly lower depth than separate science subjects but still require precision.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
  ],
}

const ZOL_ENGLISH: SubjectCurriculum = {
  subjectId: 'zol-english-language',
  syllabusCode: '4001',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/English_Language.pdf',
  topics: [
    {
      name: 'Writing — Composition',
      subtopics: ['Narrative writing — storytelling with structure (introduction, rising action, climax, resolution)', 'Descriptive writing — sensory details and imagery', 'Argumentative/persuasive writing — thesis, evidence, counter-argument', 'Expository writing — explaining clearly', 'Tenses, punctuation, paragraphing, vocabulary'],
      zimbabweContext: 'Zimbabwe compositions often use local settings: Great Zimbabwe, Victoria Falls, rural life, township life, school experiences.',
    },
    {
      name: 'Reading Comprehension',
      subtopics: ['Literal and inferential comprehension', 'Identifying main idea and supporting details', 'Vocabulary in context', 'Summarising — précis writing (reduce to a given word count)', 'Identifying writer\'s purpose, tone and attitude'],
    },
    {
      name: 'Directed Writing',
      subtopics: ['Formal letter writing (to headmaster, government official, company)', 'Informal letter writing', 'Report writing', 'Speech writing', 'Article for newspaper or magazine', 'Review writing', 'Using given information and bullet points'],
      zimbabweContext: 'Directed writing tasks often involve writing to a ZESA (electricity authority), ZINWA (water authority), or City of Harare/Bulawayo council.',
    },
    {
      name: 'Language Usage',
      subtopics: ['Parts of speech — nouns, verbs, adjectives, adverbs, pronouns, prepositions', 'Sentence types — simple, compound, complex', 'Punctuation — comma, semicolon, colon, apostrophe, inverted commas', 'Grammar — subject-verb agreement, tense consistency, active/passive voice', 'Figures of speech — simile, metaphor, personification, alliteration'],
    },
  ],
  examPapers: [
    { code: '4001/1', name: 'Paper 1 — Writing', duration: '2 hours', marks: 100, format: 'Section A: Composition (50 marks); Section B: Directed Writing (50 marks)' },
    { code: '4001/2', name: 'Paper 2 — Reading Comprehension', duration: '2 hours', marks: 80, format: 'Comprehension questions, summary writing, and language usage questions' },
  ],
  studyTips: [
    'Plan your essay before writing — even 5 minutes of planning improves structure significantly.',
    'For compositions, use vivid, specific vocabulary rather than general words.',
    'In comprehension, underline key words in questions and find the matching section in the passage.',
    'Précis writing: count words carefully and aim for exactly the required number.',
    'Directed writing: always maintain the correct format (heading, greeting, sign-off for letters).',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_HISTORY: SubjectCurriculum = {
  subjectId: 'zol-history',
  syllabusCode: '4022',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/History.pdf',
  topics: [
    {
      name: 'Pre-Colonial Zimbabwe (19th Century)',
      subtopics: ['The Rozvi State — Mambo rulers, Great Zimbabwe ruins as cultural heritage', 'The Ndebele Kingdom — Mzilikazi, Bulawayo as capital, military structure (impis)', 'Shona societies — economy, religion (Mwari cult), social organisation', 'Relations between Ndebele and Shona — raids, trade'],
      zimbabweContext: 'Zimbabwe\'s name comes from "Great Zimbabwe" — the stone-walled ruins near Masvingo, built by the Rozvi/Shona civilisation. This is a major point of national pride.',
    },
    {
      name: 'Colonisation of Zimbabwe',
      subtopics: ['Cecil John Rhodes and the BSAC (British South Africa Company)', 'The Pioneer Column (1890) — occupation of Mashonaland', 'Lobengula and the Rudd Concession (1888)', 'Occupation of Matabeleland (1893)', 'Jameson Raids', 'BSAC administration of "Rhodesia"'],
    },
    {
      name: 'The First Chimurenga (1896-1897)',
      subtopics: ['Causes — land dispossession, cattle confiscation, hut tax, forced labour', 'Ndebele uprising (1896) and Shona uprising (1896-97)', 'Role of the Mwari cult and spirit mediums (Nehanda Charwe Nyakasikana)', 'Suppression by BSAC forces', 'Legacy — Nehanda is a national heroine; "Njelele" (Voice of God) shrine in Matobo Hills'],
      zimbabweContext: 'Nehanda Charwe Nyakasikana is Zimbabwe\'s most revered national heroine — her image appeared on banknotes and her spirit medium lineage continues. "Chimurenga" (meaning "revolutionary struggle") is named after Chief Murenga.',
    },
    {
      name: 'Colonial Zimbabwe 1900-1965',
      subtopics: ['Land Apportionment Act 1930 — racial land division', 'Land Husbandry Act 1951 — forced cattle destocking', 'Labour migration — contract labour for mines and farms', 'Federation of Rhodesia and Nyasaland (1953-1963)', 'Growth of African nationalism — African National Congress (ANC of Zimbabwe 1957)', 'Banning of ZAPU (1964) and ZANU (1964) — detention of Nkomo, Mugabe, others'],
    },
    {
      name: 'UDI and the Second Chimurenga (1965-1979)',
      subtopics: ['Unilateral Declaration of Independence (UDI) by Ian Smith (11 November 1965)', 'International sanctions and their limited effect', 'Rise of ZIPRA (ZAPU\'s military wing) and ZANLA (ZANU\'s military wing)', 'Support from frontline states — Zambia, Mozambique, Tanzania', 'Battle of Chinhoyi (April 1966) — first major military engagement', 'Role of spirit mediums in the liberation war', 'Internal Settlement and Bishop Abel Muzorewa (1979)', 'Lancaster House Agreement (December 1979)'],
    },
    {
      name: 'Independence and Post-Independence Zimbabwe',
      subtopics: ['Independence — 18 April 1980; Robert Mugabe as Prime Minister', 'Gukurahundi (1983-1987) — violence in Matabeleland', 'Unity Accord (1987) — merger of ZANU-PF and PF-ZAPU; Mugabe becomes executive president', 'Economic Structural Adjustment Programme (ESAP) — 1990s', 'Land Reform Programme (2000-2002) — fast-track land reform', 'Hyperinflation (2007-2009) — worst inflation in world history', 'Government of National Unity (2009-2013)', 'November 2017 — military takeover, end of Mugabe era; Emmerson Mnangagwa becomes president'],
      zimbabweContext: 'These events are within living memory for many Zimbabwean families. Teachers and examiners expect students to show understanding of the political and economic consequences for ordinary Zimbabweans.',
    },
    {
      name: 'African History',
      subtopics: ['Pan-Africanism — Kwame Nkrumah, OAU (Organisation of African Unity, 1963)', 'Decolonisation in Africa — 1960s independence wave', 'Apartheid in South Africa — ANC, Nelson Mandela, Sharpeville massacre', 'Mau Mau uprising in Kenya', 'Congo Crisis', 'African economic challenges post-independence'],
    },
  ],
  examPapers: [
    { code: '4022/1', name: 'Paper 1 — Source-Based', duration: '1 hour 30 minutes', marks: 40, format: 'Source analysis — comprehension, inference, reliability, cross-reference, usefulness as evidence' },
    { code: '4022/2', name: 'Paper 2 — Essays', duration: '2 hours', marks: 60, format: 'Choose 3 essays from Section A (Zimbabwe history) and Section B (Africa/World history)' },
  ],
  studyTips: [
    'For source questions: always refer to the source AND use your own knowledge (contextualise).',
    'For essays: use the PEEL structure — Point, Evidence, Explain, Link.',
    'Memorise key dates: 1890 (Pioneer Column), 1965 (UDI), 1980 (Independence), 1987 (Unity Accord).',
    'Understand cause and effect — examiners want analysis, not just narration of events.',
    'Nehanda, Lobengula, Rhodes, Mugabe, Nkomo — know their roles in detail.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_GEOGRAPHY: SubjectCurriculum = {
  subjectId: 'zol-geography',
  syllabusCode: '4028',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Geography.pdf',
  topics: [
    {
      name: 'Map Reading and Interpretation',
      subtopics: ['OS map symbols', 'Grid references — four-figure and six-figure', 'Contour lines — gradient, cross-section', 'Relief features — valley, ridge, escarpment, plateau', 'Scale and distance calculation', 'Settlement patterns from maps'],
      zimbabweContext: 'ZIMSEC Geography always includes a map of Zimbabwe or a Zimbabwean area. Students must be able to read 1:50 000 and 1:250 000 maps of Zimbabwe.',
    },
    {
      name: 'Physical Geography — Plate Tectonics and Rocks',
      subtopics: ['Structure of the Earth', 'Plate tectonics — constructive, destructive, conservative margins', 'Earthquakes and volcanoes', 'Rock types — igneous, sedimentary, metamorphic', 'Rock cycle'],
      zimbabweContext: 'Zimbabwe sits on a stable cratonic platform (not tectonically active). The Great Dyke is a geological feature containing platinum, chrome, nickel — a world-class mineral deposit.',
    },
    {
      name: 'Weathering and Soils',
      subtopics: ['Mechanical weathering — freeze-thaw, exfoliation, block disintegration', 'Chemical weathering — carbonation, oxidation, hydrolysis', 'Biological weathering', 'Soil formation — factors: parent rock, climate, organisms, topography, time', 'Soil types and properties', 'Soil erosion — causes and conservation'],
      zimbabweContext: 'Soil erosion (dongas) is a major environmental issue in Zimbabwe\'s communal areas. The red ferralitic soils (mashambanzou) of Mashonaland are highly productive for maize.',
    },
    {
      name: 'Water and Drainage',
      subtopics: ['The water cycle — evaporation, condensation, precipitation, infiltration, runoff', 'River processes — erosion (hydraulic action, abrasion, corrosion, attrition), transportation, deposition', 'River landforms — V-valley, waterfall, meander, ox-bow lake, delta, floodplain', 'Lakes', 'Groundwater'],
      zimbabweContext: 'Victoria Falls (Mosi-oa-Tunya) is the world\'s largest waterfall — formed by the Zambezi River eroding a basalt gorge. Lake Kariba (on the Zambezi River) is one of the world\'s largest man-made lakes. Rivers: Limpopo, Sabi, Mzingwane all drain into neighbouring countries.',
    },
    {
      name: 'Climate and Vegetation',
      subtopics: ['Elements of weather — temperature, rainfall, humidity, wind, pressure', 'Climate graphs — temperature and rainfall', 'Tropical savanna climate (Zimbabwe\'s main climate type)', 'Zimbabwe\'s rainfall pattern — summer rainfall, wet season Nov-Mar, dry season May-Oct', 'Natural vegetation — Miombo woodland, mopane woodland, montane forest (Eastern Highlands)', 'Tropical rainforest — characteristics and distribution (not in Zimbabwe but examinable)'],
      zimbabweContext: 'Zimbabwe has a wet season (November to March) and dry season (April to October). The Highveld (Harare, 1400m) is cooler with more rainfall than the Lowveld (Beitbridge, 400m). Eastern Highlands (Nyanga, Mutare) receive up to 1800mm/year — Zimbabwe\'s highest rainfall.',
    },
    {
      name: 'Agriculture',
      subtopics: ['Types of farming — subsistence vs commercial, arable, pastoral, mixed', 'Factors affecting farming — climate, soils, relief, market, capital, labour', 'Commercial farming in Zimbabwe — tobacco (Mashonaland), maize, sugarcane (Lowveld/Triangle Sugar Estates)', 'Communal farming — subsistence, maize cultivation, livestock', 'Land reform and its effects on Zimbabwean agriculture', 'Irrigation — Tokwe-Mukorsi Dam, Mupfure River irrigation'],
      zimbabweContext: 'Zimbabwe was once called the "breadbasket of Africa" for its maize and tobacco exports. After the land reform (2000), commercial production declined. Triangle Sugar Estates in the Lowveld produces most of Zimbabwe\'s sugar.',
    },
    {
      name: 'Mining and Industry',
      subtopics: ['Types of mining — open-cast, underground, alluvial', 'Zimbabwe\'s minerals — gold (Kwekwe/Shurugwi), chrome (Great Dyke), diamonds (Marange/Chiadzwa), platinum (Great Dyke/Zimplats), coal (Hwange)', 'Factors affecting industrial location — raw materials, water, power, labour, market, transport', 'Manufacturing in Zimbabwe — Harare, Bulawayo, Mutare, Gweru are main industrial centres'],
      zimbabweContext: 'Hwange Colliery supplies coal for Hwange Thermal Power Station. Zimplats is one of the world\'s largest platinum mines. The Marange diamond fields (Chiadzwa) attracted international controversy.',
    },
    {
      name: 'Population and Settlement',
      subtopics: ['Population growth — birth rate, death rate, natural increase', 'Population distribution in Zimbabwe — most people in Highveld; Mashonaland densely populated', 'Population pyramid — shapes and what they indicate', 'Migration — rural-urban, international emigration (Zimbabwe diaspora)', 'Urbanisation — growth of Harare, Bulawayo, Mutare, Gweru', 'Settlement types — rural (villages, growth points), urban (cities, towns)'],
      zimbabweContext: 'Zimbabwe\'s population is ~16 million (2024). Harare (capital, ~2.1 million) and Bulawayo (2nd city, ~700,000). Large Zimbabwean diaspora in South Africa (2-3 million), UK (200,000+), USA.',
    },
  ],
  examPapers: [
    { code: '4028/1', name: 'Paper 1 — Physical Geography and Map Reading', duration: '2 hours', marks: 80, format: 'Section A: Map/resource interpretation; Section B: Physical geography questions' },
    { code: '4028/2', name: 'Paper 2 — Human Geography', duration: '2 hours', marks: 80, format: 'Agriculture, population, settlement, industry, development questions for Zimbabwe and global contexts' },
  ],
  studyTips: [
    'Practice map reading every week — grid references, contour lines, and identifying features.',
    'Victoria Falls and Lake Kariba are always relevant — know formation processes and human uses.',
    'For agriculture questions, always link to specific Zimbabwean regions and crops.',
    'Population questions: use actual Zimbabwe figures — 16 million population, Harare as capital.',
    'Climate graphs — practise drawing and interpreting them for Harare, Bulawayo, and Mutare.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_ACCOUNTS: SubjectCurriculum = {
  subjectId: 'zol-accounts',
  syllabusCode: '4006',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Accounting_Forms1-4.pdf',
  topics: [
    { name: 'Introduction to Accounting', subtopics: ['Purpose of accounting', 'Types of business organisations', 'The accounting equation: Assets = Liabilities + Capital', 'Source documents — invoice, receipt, credit note, debit note, cheque'] },
    { name: 'Double-Entry Bookkeeping', subtopics: ['Debit and credit rules', 'Types of accounts — asset, liability, capital, revenue, expense', 'Ledger accounts — personal, real, nominal', 'Books of prime entry — cash book, sales day book, purchases day book, returns books, journal'] },
    { name: 'Trial Balance', subtopics: ['Extracting a trial balance from ledger accounts', 'Errors that do and do not affect the trial balance', 'Suspense account and correction of errors'] },
    { name: 'Financial Statements', subtopics: ['Trading Account — gross profit calculation', 'Profit and Loss Account — net profit calculation', 'Balance Sheet — assets, liabilities, capital', 'Accruals and prepayments', 'Provision for doubtful debts', 'Depreciation — straight-line and reducing balance methods'] },
    { name: 'Bank Reconciliation', subtopics: ['Cash book vs bank statement', 'Unpresented cheques, deposits in transit, bank charges, standing orders', 'Preparing bank reconciliation statement'] },
    { name: 'Partnership Accounts', subtopics: ['Partnership agreement and appropriation account', 'Capital and current accounts', 'Goodwill', 'Admission of a new partner, retirement, dissolution'] },
    { name: 'Clubs and Societies', subtopics: ['Receipts and Payments Account', 'Income and Expenditure Account', 'Accumulated fund'], zimbabweContext: 'Examples use Zimbabwe clubs (football clubs, burial societies, farming cooperatives).' },
    { name: 'Manufacturing Accounts', subtopics: ['Cost of production — prime cost, factory cost', 'Manufacturing, Trading, Profit and Loss Account combined'] },
  ],
  examPapers: [
    { code: '4006/1', name: 'Paper 1 — Short Questions and Structured', duration: '2 hours', marks: 100, format: 'Short structured accounting questions' },
    { code: '4006/2', name: 'Paper 2 — Extended Accounting Problems', duration: '2 hours', marks: 100, format: 'Complete financial statements, partnership accounts, specialised accounts' },
  ],
  studyTips: [
    'Practise double entry until it is second nature — every debit has an equal credit.',
    'Layout matters — use proper accounting format with columns, lines and correct headings.',
    'For every depreciation question, state which method is being used and show workings clearly.',
    'Bank reconciliation: start with the cash book balance, then adjust, or start with bank statement — both approaches are valid.',
    'Partnership appropriation accounts: apply interest on capital, salary allowances, then divide remaining profit in profit-sharing ratio.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_COMMERCE: SubjectCurriculum = {
  subjectId: 'zol-commerce',
  syllabusCode: '4005',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Commerce_Forms1-4.pdf',
  topics: [
    { name: 'Trade and Distribution', subtopics: ['Home trade and foreign trade', 'Wholesalers, retailers, agents, brokers', 'Chain of distribution — producer to consumer', 'E-commerce and online trading', 'Fairs and markets'], zimbabweContext: 'Zimbabwe\'s informal sector (flea markets, kombis, vendors) plays a huge role — examples from Mbare Musika, Bulawayo market are relevant.' },
    { name: 'Banking and Finance', subtopics: ['Reserve Bank of Zimbabwe (RBZ) — central bank functions', 'Commercial banks — FBC, CBZ, Stanbic, Standard Chartered in Zimbabwe', 'Services: savings, loans, current accounts, mobile money (EcoCash, OneMoney)', 'Negotiable instruments — cheque, bill of exchange, promissory note', 'Credit card, debit card, mobile banking'], zimbabweContext: 'EcoCash (Econet) is Zimbabwe\'s dominant mobile money platform; critical to understand after the hyperinflation era when cash was scarce.' },
    { name: 'Insurance', subtopics: ['Principles of insurance — insurable interest, utmost good faith, indemnity, subrogation, contribution', 'Types of insurance — life, fire, motor, marine, health', 'Zimbabwe insurers: NICOZ Diamond, Old Mutual Zimbabwe, First Mutual'] },
    { name: 'Transport and Communication', subtopics: ['Types of transport — road, rail, air, water, pipeline', 'NRZ (National Railways of Zimbabwe)', 'ZUPCO buses; Air Zimbabwe', 'Factors affecting choice of transport', 'Communication — postal services (Zimpost), ZBC, internet, mobile networks (Econet, Telecel, Netone)'] },
    { name: 'Advertising and Marketing', subtopics: ['Functions and types of advertising', 'Media — TV (ZBC), radio, newspapers (The Herald, The Chronicle)', 'Below-the-line and above-the-line advertising', 'Consumer protection — Zimbabwe Consumer Council', 'Branding and packaging'] },
    { name: 'Business Organisations', subtopics: ['Sole trader, partnership, private limited company (Pvt Ltd), public limited company (Ltd)', 'Cooperatives — common in Zimbabwe agriculture', 'Parastatals and state enterprises — ZESA, ZINWA, GMB', 'NGOs and charitable organisations'], zimbabweContext: 'GMB (Grain Marketing Board) buys maize from farmers; ZESA (Zimbabwe Electricity Supply Authority) distributes electricity. These state enterprises are central to Zimbabwe\'s economy.' },
    { name: 'Government and Business', subtopics: ['Role of government — regulation, taxation, provision of services', 'VAT (Value Added Tax) in Zimbabwe', 'Customs duty and excise duty', 'Zimbabwe Revenue Authority (ZIMRA)', 'Competition and monopoly regulation', 'Consumer rights and the Consumer Contracts Act'] },
  ],
  examPapers: [
    { code: '4005/1', name: 'Paper 1 — Multiple Choice and Short Answer', duration: '1 hour 30 minutes', marks: 60, format: '30 MCQ + short structured answers' },
    { code: '4005/2', name: 'Paper 2 — Essays and Extended Answers', duration: '1 hour 30 minutes', marks: 60, format: 'Essay questions — knowledge, application, analysis' },
  ],
  studyTips: [
    'Use specific Zimbabwe examples: EcoCash, ZESA, GMB, NRZ, CBZ Bank — examiners reward local knowledge.',
    'Learn the principles of insurance thoroughly — ZIMSEC tests these in detail.',
    'Chain of distribution diagrams are commonly tested — practise drawing them.',
    'For essays, structure your answer: define, explain, give examples, evaluate.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_AGRICULTURE: SubjectCurriculum = {
  subjectId: 'zol-agriculture',
  syllabusCode: '4033',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Agriculture_Forms1-4.pdf',
  topics: [
    { name: 'Soil Science', subtopics: ['Soil formation and composition — mineral particles, organic matter, air, water', 'Soil texture — clay, silt, sand, loam', 'Soil structure and porosity', 'Soil pH and its importance for crop growth', 'Soil fertility and plant nutrients — N, P, K (macronutrients)', 'Soil erosion — types (sheet, rill, gully/dongas) and conservation measures'], zimbabweContext: 'Zimbabwe\'s red ferralitic soils (type C soils) are typical of the Highveld. Dongas (gullies) in communal areas of Mashonaland are major conservation challenges.' },
    { name: 'Crop Production', subtopics: ['Zimbabwe\'s major crops: Maize (staple food), tobacco (main export earner historically), cotton, sugarcane, wheat, soybeans, groundnuts, sorghum, millet', 'Crop rotation and its benefits', 'Tillage — ploughing, harrowing, ridging; conservation tillage', 'Planting — seed selection, spacing, depth', 'Fertiliser application — basal and top dressing (AN, CAN, Compound D, Compound C)', 'Irrigation — furrow, drip, sprinkler; Tokwe-Mukorsi Dam; smallholder irrigation schemes', 'Pest and disease management — integrated pest management (IPM)', 'Harvesting, storage (grain bins, cribs) and marketing (GMB depots)'], zimbabweContext: 'Maize is Zimbabwe\'s staple crop. Compound D fertiliser is applied at planting; Ammonium Nitrate (AN) is top-dressed at 6 weeks. GMB (Grain Marketing Board) is the government buyer of grain.' },
    { name: 'Animal Husbandry', subtopics: ['Cattle breeds in Zimbabwe — Hereford, Brahman, Afrikaner, Sussex (commercial); Mashona, Nkone (indigenous breeds)', 'Cattle production — beef and dairy', 'Goat and sheep farming', 'Poultry — broilers (Irvines, Profeeds are local brands) and layers', 'Pig production', 'Animal nutrition — roughage, concentrates', 'Animal health — common diseases: Foot and Mouth Disease (FMD), Newcastle disease (poultry), Maize streak virus (plants)', 'Dipping for tick-borne diseases (East Coast Fever) — dip tanks are a feature of Zimbabwe communal areas'], zimbabweContext: 'Cattle are a major store of wealth in Zimbabwe\'s rural economy. Lobola (bride price) is traditionally paid in cattle. Tick-borne diseases (East Coast Fever, heartwater) decimated herds — dip tanks were established throughout Zimbabwe from the colonial era.' },
    { name: 'Farm Management', subtopics: ['Types of farm businesses — commercial farms, A1 and A2 farms (post-land reform), communal areas', 'Farm records and accounts', 'Enterprise selection — cash crops vs food crops', 'Labour management', 'Marketing — contract farming, cooperatives, GMB, private buyers'], zimbabweContext: 'A1 farms (small-scale) and A2 farms (medium-scale) are land reform beneficiary categories unique to Zimbabwe.' },
  ],
  examPapers: [
    { code: '4033/1', name: 'Paper 1 — Theory', duration: '2 hours', marks: 100, format: 'Multiple choice and structured questions' },
    { code: '4033/2', name: 'Paper 2 — Practical', duration: '2 hours', marks: 100, format: 'Practical skills assessment; farm-based tasks' },
  ],
  studyTips: [
    'Use specific Zimbabwe examples: Mashona cattle, Irvines chickens, maize cultivation, GMB.',
    'Learn fertiliser names and application methods — Compound D at planting, AN for top dressing.',
    'Soil conservation is always examined — know at least five methods (terracing, contour ridging, grass strips, minimum tillage, mulching).',
    'Animal disease names matter: know Newcastle disease (poultry), FMD (cattle), East Coast Fever (tick-borne).',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZOL_COMPUTER_SCIENCE: SubjectCurriculum = {
  subjectId: 'zol-computer-science',
  syllabusCode: '4051',
  level: 'O-Level',
  curriculum: 'ZIMSEC',
  syllabusFile: '/knowledge/syllabuses/o-level/Computer_Science.pdf',
  topics: [
    { name: 'Data Representation', subtopics: ['Binary number system (base 2)', 'Hexadecimal (base 16)', 'Conversion: binary ↔ denary ↔ hexadecimal', 'Binary addition', 'Two\'s complement for negative numbers', 'ASCII and Unicode character encoding', 'Image representation — pixels, resolution, colour depth', 'Sound representation — sampling rate, bit depth'] },
    { name: 'Computer Systems', subtopics: ['Von Neumann architecture — CPU, memory, I/O', 'CPU components — ALU, CU, registers, clock', 'Fetch-decode-execute cycle', 'Memory — RAM, ROM, cache; primary vs secondary', 'Storage devices — HDD, SSD, USB, optical discs', 'Input and output devices'] },
    { name: 'Networking', subtopics: ['Types of networks — LAN, WAN, MAN', 'Network topologies — bus, star, ring, mesh', 'Network hardware — router, switch, hub, modem, NIC', 'Protocols — TCP/IP, HTTP, HTTPS, FTP, SMTP', 'The Internet and World Wide Web', 'Network security — firewalls, encryption, passwords', 'Cybercrime — hacking, phishing, identity theft'], zimbabweContext: 'Zimbabwe\'s internet infrastructure: Econet, TelOne, ZOL. Internet penetration is growing; mobile internet via 4G is dominant in Zimbabwe.' },
    { name: 'Programming', subtopics: ['Algorithms — sequence, selection (if/else), iteration (for, while)', 'Pseudocode and flowcharts', 'Variables, constants, data types', 'Operators — arithmetic, comparison, logical', 'Arrays and lists', 'Subroutines — procedures and functions', 'String manipulation', 'File handling (read, write, append)'] },
    { name: 'Databases', subtopics: ['Database concepts — tables, fields, records', 'Primary key and foreign key', 'SQL — SELECT, WHERE, ORDER BY, INSERT, UPDATE, DELETE', 'Entity-relationship (ER) diagrams', 'Data validation — range check, type check, presence check', 'Flat-file vs relational databases'] },
    { name: 'Systems Development', subtopics: ['Systems development lifecycle (SDLC)', 'Analysis, design, implementation, testing, evaluation', 'Testing — white-box, black-box, dry run', 'Documentation — user and technical', 'Ethical and social issues — privacy, copyright, cyberbullying'] },
  ],
  examPapers: [
    { code: '4051/1', name: 'Paper 1 — Theory', duration: '1 hour 30 minutes', marks: 75, format: 'Structured theory questions' },
    { code: '4051/2', name: 'Paper 2 — Practical (Programming)', duration: '2 hours', marks: 75, format: 'Practical programming tasks' },
  ],
  studyTips: [
    'Practise binary/hex conversions until they are fast — these come up frequently.',
    'Learn pseudocode conventions thoroughly — ZIMSEC has its own pseudocode standard.',
    'For algorithms, trace through your code with test data before submission.',
    'SQL: practice SELECT statements with WHERE conditions and multiple tables.',
    'Network questions always ask about protocols — know HTTP, HTTPS, FTP, SMTP, TCP/IP roles.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

// ─── ZIMSEC A-Level ───────────────────────────────────────────────────────────

const ZAL_PURE_MATHS: SubjectCurriculum = {
  subjectId: 'zal-pure-mathematics',
  syllabusCode: '6044',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    {
      name: 'Algebra',
      subtopics: ['Polynomials — division, remainder and factor theorems', 'Partial fractions — distinct linear, repeated linear, irreducible quadratic factors', 'Binomial theorem — expansion of (a+b)ⁿ for positive integer n and (1+x)ⁿ for any rational n', 'Logarithms and exponentials — laws of logarithms, natural log', 'Quadratic inequalities', 'Modulus function and equations'],
    },
    {
      name: 'Functions',
      subtopics: ['Domain and range', 'Composite functions (fg)', 'Inverse functions f⁻¹', 'Odd, even, periodic functions', 'Transformation of graphs — translations, stretches, reflections', 'Modulus graphs'],
    },
    {
      name: 'Coordinate Geometry',
      subtopics: ['Cartesian and parametric equations of curves', 'Circle equation (x−a)²+(y−b)²=r²', 'Tangent and normal to a circle', 'Intersection of lines and circles'],
    },
    {
      name: 'Trigonometry',
      subtopics: ['Radians — arc length and sector area', 'Compound angle formulae (sin(A±B), cos(A±B), tan(A±B))', 'Double angle formulae', 'Half angle formulae', 'Rsinθ+Rcosθ = Rsin(θ+α) form', 'Trigonometric equations and general solutions', 'Inverse trig functions (arcsin, arccos, arctan)'],
    },
    {
      name: 'Differentiation',
      subtopics: ['First principles', 'Standard derivatives', 'Chain rule', 'Product rule', 'Quotient rule', 'Implicit differentiation', 'Parametric differentiation', 'Higher derivatives', 'Applications — tangents, normals, stationary points, optimisation', 'Maclaurin series'],
    },
    {
      name: 'Integration',
      subtopics: ['Standard integrals', 'Integration by substitution', 'Integration by parts', 'Partial fractions before integration', 'Definite integrals — area under curve and between curves', 'Volume of revolution', 'Improper integrals', 'Numerical integration — trapezium rule'],
    },
    {
      name: 'Differential Equations',
      subtopics: ['First order — separation of variables', 'First order linear — integrating factor', 'Second order — complementary function and particular integral', 'Modelling with differential equations'],
    },
    {
      name: 'Vectors',
      subtopics: ['Magnitude and unit vectors', 'Addition, subtraction, scalar multiplication', 'Scalar (dot) product and angle between vectors', 'Vector (cross) product', 'Equation of a line in vector form', 'Angle between lines', 'Closest distance between skew lines', 'Equation of a plane'],
    },
    {
      name: 'Complex Numbers',
      subtopics: ['Cartesian form a+bi', 'Modulus and argument', 'Argand diagram', 'Multiplication and division in modulus-argument form', 'De Moivre\'s theorem and nth roots of unity', 'Loci in the complex plane'],
    },
    {
      name: 'Matrices',
      subtopics: ['Matrix operations — addition, multiplication', '2×2 and 3×3 determinants', 'Inverse matrices', 'Eigenvalues and eigenvectors', 'Matrix transformations in 2D'],
    },
    {
      name: 'Sequences and Series',
      subtopics: ['Arithmetic and geometric sequences and series', 'Convergent geometric series — sum to infinity', 'Sigma notation', 'Method of differences'],
    },
    {
      name: 'Proof',
      subtopics: ['Proof by induction', 'Proof by contradiction', 'Disproof by counterexample'],
    },
  ],
  examPapers: [
    { code: '6044/1', name: 'Paper 1 — Pure Mathematics 1', duration: '3 hours', marks: 120, format: 'All pure topics; all questions compulsory; full working required for every step' },
    { code: '6044/2', name: 'Paper 2 — Pure Mathematics 2', duration: '3 hours', marks: 120, format: 'More advanced pure topics; full working; multi-step proof questions' },
  ],
  studyTips: [
    'Write out every step of working — method marks are awarded throughout each solution.',
    'Prove all standard results; examiners can ask you to derive any formula.',
    'Complex number loci require both algebraic and geometric understanding.',
    'Integration by parts: "LIATE" rule for choosing u (Logarithm, Inverse trig, Algebraic, Trigonometric, Exponential).',
    'For differential equations, always include the constant of integration and apply boundary conditions.',
  ],
  pastPapers: [
    { source: 'Zambuko', url: 'https://zambuko.vercel.app/zimsec' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZAL_PHYSICS: SubjectCurriculum = {
  subjectId: 'zal-physics',
  syllabusCode: '6060',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Mechanics', subtopics: ['Kinematics in 1D and 2D — projectiles', 'Newton\'s laws — linear and angular', 'Momentum and impulse; collisions', 'Energy — KE, PE, work-energy theorem', 'Circular motion — centripetal acceleration and force', 'Gravitational fields — Newton\'s law, field strength, potential, potential energy, satellites, escape velocity'] },
    { name: 'Thermal Physics', subtopics: ['Temperature and thermal equilibrium', 'Ideal gas law (pV=nRT)', 'Kinetic theory of gases', 'First law of thermodynamics (ΔU=Q−W)', 'Specific heat capacity and latent heat', 'Thermodynamic processes — isothermal, adiabatic, isochoric, isobaric'] },
    { name: 'Oscillations and Waves', subtopics: ['Simple Harmonic Motion (SHM) — equations, graphs, energy', 'Damped and forced oscillations, resonance', 'Progressive waves — all properties', 'Stationary waves — nodes, antinodes, harmonics', 'Electromagnetic spectrum', 'Doppler effect', 'Diffraction — single and double slit', 'Interference — Young\'s double slit experiment'] },
    { name: 'Electric Fields', subtopics: ['Coulomb\'s law', 'Electric field strength and potential', 'Capacitors — capacitance, parallel-plate, energy stored', 'Charging and discharging of capacitors (RC circuits)', 'Dielectrics'] },
    { name: 'Magnetic Fields and Electromagnetism', subtopics: ['Magnetic flux density', 'Force on moving charge and current (F=BIL, F=Bqv)', 'Cyclotron and Hall effect', 'Electromagnetic induction — Faraday\'s and Lenz\'s law', 'Self-induction and mutual induction', 'Transformers and AC circuits', 'Impedance, reactance — inductive and capacitive'] },
    { name: 'Quantum and Atomic Physics', subtopics: ['Photoelectric effect — Einstein\'s equation (E=hf=Φ+½mv²)', 'Wave-particle duality — de Broglie wavelength', 'Bohr model of hydrogen atom', 'Energy levels and line spectra', 'X-ray production', 'Electron diffraction'] },
    { name: 'Nuclear Physics', subtopics: ['Nuclear structure — proton number, mass number', 'Binding energy and mass defect (E=mc²)', 'Radioactive decay — alpha, beta, gamma', 'Half-life and radioactive decay equations', 'Nuclear fission and chain reaction', 'Nuclear fusion', 'Particle physics — quarks, leptons, hadrons (introductory)'] },
    { name: 'Practical Skills', subtopics: ['Measurement and uncertainty', 'Graphs — plotting, gradient, intercept analysis', 'Experimental design', 'Error analysis — systematic and random errors'] },
  ],
  examPapers: [
    { code: '6060/1', name: 'Paper 1 — Theory', duration: '3 hours', marks: 120, format: 'Structured and extended response questions on all topics' },
    { code: '6060/2', name: 'Paper 2 — Practical', duration: '2 hours 30 minutes', marks: 60, format: 'Two practical exercises in the lab; data collection and analysis' },
  ],
  studyTips: [
    'Derive all equations from first principles — examiners frequently ask "show that...".',
    'SHM diagrams (displacement, velocity, acceleration vs time) must be precise.',
    'For electromagnetic induction: always apply Lenz\'s law and state the direction of the induced current/force.',
    'Nuclear equations: both atomic number and mass number must balance.',
    'In practical work: always show uncertainty bars on graphs and calculate gradient with uncertainty range.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers (Physics A-Level 2025)', url: 'https://www.scribd.com/document/816045036/Physics-a-Level-Syllabusdec2024final' },
  ],
}

const ZAL_CHEMISTRY: SubjectCurriculum = {
  subjectId: 'zal-chemistry',
  syllabusCode: '6070',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Atomic Structure and Bonding', subtopics: ['Orbital theory — s, p, d orbitals', 'Electronic configuration including d-block', 'Ionic, covalent, metallic, coordinate bonding', 'VSEPR theory — shapes of molecules (linear, trigonal planar, tetrahedral, octahedral)', 'Polarity and dipole moments', 'Intermolecular forces — van der Waals, permanent dipole, hydrogen bonding'] },
    { name: 'Energetics (Thermodynamics)', subtopics: ['Standard enthalpy changes — formation, combustion, neutralisation, atomisation', 'Hess\'s law and Born-Haber cycles', 'Bond enthalpy calculations', 'Entropy and Gibbs free energy (ΔG=ΔH−TΔS)', 'Feasibility of reactions'] },
    { name: 'Chemical Equilibrium', subtopics: ['Law of mass action', 'Kc and Kp expressions', 'Le Chatelier\'s principle — effect of concentration, pressure, temperature', 'Haber process and Contact process applications', 'Relationship between Kc and Kp'] },
    { name: 'Acid-Base Equilibria', subtopics: ['Brønsted-Lowry theory', 'Ka, Kb and Kw expressions', 'pH calculations — strong and weak acids and bases', 'Buffer solutions — composition and pH calculation', 'Titration curves — shapes for different acid-base combinations', 'Indicators and their selection'] },
    { name: 'Electrochemistry', subtopics: ['Electrode potentials — standard hydrogen electrode', 'Electrochemical series', 'EMF calculations', 'Electrolysis — quantitative (Faraday\'s laws)', 'Corrosion — electrochemical explanation and prevention'] },
    { name: 'Kinetics', subtopics: ['Rate equations — rate constant k, order of reaction', 'Initial rate method and integrated rate equations', 'Activation energy — Arrhenius equation (k=Ae^(-Ea/RT))', 'Catalysis — homogeneous and heterogeneous', 'Mechanisms — rate determining step'] },
    { name: 'The Periodic Table — d-block and Periodicity', subtopics: ['Period 3 trends — atomic radius, ionisation energy, electronegativity, oxides', 'Group 2 (alkaline earth metals) — reactions, solubility trends', 'Group 7 (halogens) — oxidising ability, halide reactions', 'Transition metals — variable oxidation states, complex ions, colours, catalytic activity', 'Ligands, complex ion nomenclature'] },
    { name: 'Organic Chemistry', subtopics: ['Isomerism — structural, geometric (cis/trans), optical', 'Alkanes — radical substitution mechanism', 'Alkenes — electrophilic addition; Markovnikov\'s rule', 'Halogenoalkanes — SN1 and SN2 mechanisms', 'Alcohols, aldehydes, ketones, carboxylic acids, esters, amides', 'Amines — basicity, acylation, coupling reactions', 'Aromatic chemistry — benzene, electrophilic substitution', 'Polymers — addition and condensation; biodegradability'] },
    { name: 'Analysis', subtopics: ['Mass spectrometry — molecular ion, fragmentation pattern', 'IR spectroscopy — identifying functional groups', 'NMR spectroscopy — chemical shift, integration, splitting patterns', 'Chromatography — TLC, GC, HPLC'] },
  ],
  examPapers: [
    { code: '6070/1', name: 'Paper 1 — Theory', duration: '3 hours', marks: 120, format: 'All sections; structured and extended questions; including organic mechanisms' },
    { code: '6070/2', name: 'Paper 2 — Practical', duration: '2 hours 30 minutes', marks: 60, format: 'Practical experiments in the laboratory — titrations, qualitative analysis, synthesis' },
  ],
  studyTips: [
    'Organic mechanisms must be drawn with curly arrows — no curly arrows = no marks.',
    'For every enthalpy question, draw a Hess\'s law cycle before calculating.',
    'pH calculations: memorise the sequence — Kw, Ka, Kb, buffer formula (Henderson-Hasselbalch).',
    'Transition metal reactions: memorise colours of complex ions (Cu²⁺ blue, Cr³⁺ green, Fe³⁺ yellow/brown, Mn²⁺ pale pink).',
    'Always show units in answers and give answers to the appropriate number of significant figures.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZAL_BIOLOGY: SubjectCurriculum = {
  subjectId: 'zal-biology',
  syllabusCode: '6040',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Biological Molecules', subtopics: ['Carbohydrates — monosaccharides, disaccharides, polysaccharides', 'Lipids — triglycerides, phospholipids', 'Proteins — amino acids, peptide bonds, primary to quaternary structure', 'Enzymes — induced fit model, kinetics, inhibition', 'DNA and RNA structure', 'ATP and its role in energy transfer', 'Water — properties and biological importance'] },
    { name: 'Cell Biology', subtopics: ['Prokaryotic vs eukaryotic cells', 'Organelle structure and function (detailed)', 'Cell membrane — fluid mosaic model, transport mechanisms', 'Cell cycle — interphase, mitosis (PMAT), cytokinesis', 'Meiosis and genetic variation'] },
    { name: 'Exchange and Transport', subtopics: ['Gas exchange in insects, fish, mammals, leaves', 'The mammalian heart — cardiac output, heart sounds, ECG', 'Haemoglobin — oxygen dissociation curve, Bohr effect, foetal haemoglobin', 'Transport in plants — cohesion-tension theory, phloem translocation (source-sink)'] },
    { name: 'Genetics and Inheritance', subtopics: ['DNA replication — semi-conservative model', 'Transcription and translation — detailed mechanisms', 'The genetic code — codons, anticodons', 'Gene expression — operons (lac, trp)', 'Monohybrid and dihybrid crosses', 'Autosomal linkage and crossing over', 'Sex linkage', 'Epistasis and gene interaction', 'Hardy-Weinberg principle for population genetics'] },
    { name: 'Genetic Engineering and Biotechnology', subtopics: ['Recombinant DNA technology — restriction enzymes, ligase, vectors', 'PCR and DNA fingerprinting (applications in Zimbabwe: criminal investigations, paternity tests)', 'Cloning — therapeutic and reproductive', 'Gene therapy', 'Transgenics — GM crops (relevant to Zimbabwe food security debate)', 'Monoclonal antibodies — production and applications'] },
    { name: 'Ecology', subtopics: ['Population ecology — logistic growth, carrying capacity', 'Interspecific relationships — predation, competition, mutualism, parasitism', 'Community ecology — succession, climax community', 'Energy flow through ecosystems — productivity, efficiency', 'Biogeochemical cycles — carbon, nitrogen, phosphorus', 'Human impacts — deforestation, climate change, eutrophication, conservation', 'Biodiversity — measurement (Simpson\'s index), conservation strategies'], zimbabweContext: 'Hwange National Park elephant population exceeds carrying capacity — a real conservation challenge. Zimbabwe\'s wetlands (Masvingo region) and Lake Chivero (Harare\'s reservoir, eutrophication case study) are relevant examples.' },
    { name: 'Animal and Plant Physiology', subtopics: ['Nervous system — resting potential, action potential, synaptic transmission', 'Hormonal coordination — hypothalamus-pituitary axis', 'Kidney — detailed filtration, reabsorption, countercurrent multiplier', 'Thermoregulation — ectotherms vs endotherms', 'Plant growth regulators — gibberellins, cytokinins, abscisic acid, ethene', 'Photosynthesis — light reactions (Z-scheme), Calvin cycle', 'Respiration — glycolysis, link reaction, Krebs cycle, oxidative phosphorylation'] },
    { name: 'Evolution and Biodiversity', subtopics: ['Darwinian natural selection', 'Types of selection — directional, stabilising, disruptive', 'Speciation — allopatric and sympatric', 'Evidence for evolution — fossil record, comparative anatomy, molecular biology', 'Classification — binomial nomenclature, cladistics', 'Biological species concept'] },
  ],
  examPapers: [
    { code: '6040/1', name: 'Paper 1 — Theory', duration: '3 hours', marks: 120, format: 'Structured and essay questions; detailed diagrams required' },
    { code: '6040/2', name: 'Paper 2 — Practical', duration: '2 hours 30 minutes', marks: 60, format: 'Practical exercises — microscopy, dissection, data analysis' },
  ],
  studyTips: [
    'Draw fully labelled diagrams for all processes — photosynthesis Z-scheme, action potential, nephron.',
    'The oxygen dissociation curve: understand the shape, shifts (Bohr effect), and real-life significance.',
    'For genetics questions at A-Level, always specify parental genotypes and work through every cross carefully.',
    'Hardy-Weinberg: memorise both equations (p+q=1 and p²+2pq+q²=1) and when the equilibrium applies.',
    'Biotechnology questions — GM crops and genetic engineering are contentious topics; show both benefits and concerns.',
  ],
  pastPapers: [
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZAL_ECONOMICS: SubjectCurriculum = {
  subjectId: 'zal-economics',
  syllabusCode: '6020',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Microeconomics — Demand and Supply', subtopics: ['Law of demand, demand determinants', 'Law of supply, supply determinants', 'Price elasticity of demand (PED), income elasticity (YED), cross-price elasticity (XED)', 'Price elasticity of supply (PES)', 'Consumer surplus, producer surplus', 'Price mechanism and allocative efficiency'] },
    { name: 'Consumer and Producer Theory', subtopics: ['Utility theory — total and marginal utility', 'Consumer equilibrium and indifference curve analysis', 'Production theory — short run and long run', 'Law of diminishing returns', 'Returns to scale — economies and diseconomies of scale', 'Cost curves — TC, TVC, TFC, AC, AVC, MC'] },
    { name: 'Market Structures', subtopics: ['Perfect competition — characteristics and long-run equilibrium', 'Monopoly — profit maximisation, deadweight loss, price discrimination', 'Monopolistic competition — product differentiation, excess capacity', 'Oligopoly — game theory, price rigidity, collusion (cartels)', 'Contestable markets'] },
    { name: 'Factor Markets and Income Distribution', subtopics: ['Labour market — MRP theory of wages', 'Trade unions in Zimbabwe — ZCTU, minimum wage legislation', 'Poverty and inequality — Gini coefficient', 'Government policies to reduce poverty'], zimbabweContext: 'Zimbabwe\'s labour market: high unemployment (~85% at peak unemployment), informal sector dominance, ZCTU. Government-set minimum wages in USD.' },
    { name: 'Market Failures and Government Intervention', subtopics: ['Externalities — negative (pollution, Harare sewage crisis) and positive', 'Public goods — non-rivalrous, non-excludable (ZESA grid as mixed good)', 'Merit goods and demerit goods', 'Monopoly power as market failure', 'Government policies — taxes, subsidies, regulations, price controls', 'Government failure'] },
    { name: 'Macroeconomics — National Income', subtopics: ['GDP, GNP, NNP — measurement approaches', 'Circular flow of income', 'Aggregate Demand and Aggregate Supply model', 'Multiplier effect', 'Business cycle — boom, recession, depression, recovery'], zimbabweContext: 'Zimbabwe\'s GDP has fluctuated dramatically: hyperinflation of 2007-2009 (500 billion % inflation), dollarisation in 2009, reintroduction of ZWG currency in 2024. Students must understand hyperinflation causes and consequences from Zimbabwe\'s own experience.' },
    { name: 'Money and Banking', subtopics: ['Functions of money', 'Money supply — narrow (M1) and broad (M2, M3)', 'Reserve Bank of Zimbabwe (RBZ) — monetary policy tools', 'Inflation — causes (demand-pull, cost-push, monetary), effects', 'Hyperinflation — Zimbabwe case study (2007-2009)', 'Deflation', 'Exchange rate systems — fixed, floating, managed float; Zimbabwe\'s currency history'], zimbabweContext: 'Zimbabwe has one of the most dramatic monetary histories: hyperinflation that required Z$100 trillion notes, dollarisation in 2009, reintroduction of RTGS dollar in 2019, ZiG in 2024. This is a globally-studied case study in monetary economics.' },
    { name: 'Fiscal Policy', subtopics: ['Government revenue — taxes (VAT, income tax, corporate tax, ZIMRA)', 'Government expenditure — recurrent vs capital', 'Budget balance — surplus, deficit, balanced budget', 'National debt', 'Fiscal multiplier', 'Expansionary vs contractionary fiscal policy', 'Zimbabwe budget deficits and quasi-fiscal activities (RBZ printing money)'] },
    { name: 'International Economics', subtopics: ['Comparative advantage and gains from trade', 'Terms of trade', 'Balance of payments — current account, capital account, financial account', 'Trade policy — tariffs, quotas, subsidies; SADC, COMESA', 'Exchange rate determination — PPP theory', 'Zimbabwe\'s trade — exports: platinum, gold, tobacco, ferrochrome; imports: fuel, electricity, manufactured goods'] },
    { name: 'Development Economics', subtopics: ['Characteristics of developing economies', 'Measuring development — HDI, Gini, literacy', 'Barriers to development — poverty cycle, debt, brain drain, unfair trade', 'Strategies for development — structural transformation, export-led, import substitution', 'Aid, FDI, and remittances in Zimbabwe\'s context', 'Sustainable development goals (SDGs)'], zimbabweContext: 'Zimbabwe receives significant remittances from diaspora (estimated >$1 billion/year) — a major source of foreign exchange. IMF and World Bank structural adjustment (ESAP, 1991-1995) and its effects on Zimbabwe are standard case studies.' },
  ],
  examPapers: [
    { code: '6020/1', name: 'Paper 1 — Data Response', duration: '2 hours 30 minutes', marks: 80, format: 'Two data response questions on micro and macroeconomics; evaluate policies using theory' },
    { code: '6020/2', name: 'Paper 2 — Essays', duration: '2 hours 30 minutes', marks: 80, format: 'Choose two from four essay questions — argue, evaluate and recommend' },
  ],
  studyTips: [
    'Always use Zimbabwe-specific examples in your essays — examiners reward relevant local knowledge.',
    'Zimbabwe\'s hyperinflation case study must be mastered — it appears in money, inflation, and development questions.',
    'Diagrams must be labelled correctly — AD/AS shifts, supply/demand, market structure diagrams.',
    'For evaluation marks: always state the short-run vs long-run distinction and consider opposing arguments.',
    'Kariba Dam, Marange diamonds, Hwange coal, ZESA — know how they link to macro topics (energy, FDI, exports).',
  ],
  pastPapers: [
    { source: 'Zambuko', url: 'https://zambuko.vercel.app/zimsec' },
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

const ZAL_ACCOUNTING: SubjectCurriculum = {
  subjectId: 'zal-accounting',
  syllabusCode: '6001',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Financial Accounting', subtopics: ['Accounting concepts — going concern, accruals, consistency, prudence, materiality', 'Company accounts — share capital, debentures, reserves', 'Income statement and statement of financial position for limited companies', 'Cash flow statements (IAS 7)', 'Group accounts — consolidated financial statements', 'Accounting for non-current assets — revaluation, disposal', 'Lease accounting — finance vs operating lease'] },
    { name: 'Management Accounting', subtopics: ['Marginal costing vs absorption costing', 'Breakeven analysis — contribution, margin of safety', 'Budgeting — master budget, flexed budget, variance analysis', 'Standard costing — material, labour, overhead variances', 'Capital investment appraisal — NPV, IRR, payback period, ARR', 'Activity-based costing (ABC)'] },
    { name: 'Analysis and Interpretation', subtopics: ['Ratio analysis — profitability (GP%, NP%, ROCE), liquidity (current, acid test), efficiency (debtor days, stock turnover), gearing (debt-to-equity)', 'Limitations of ratio analysis', 'Trend analysis and comparative statements'] },
    { name: 'Auditing', subtopics: ['Purpose of auditing — shareholders\' confidence', 'Internal vs external audit', 'Audit procedures — sampling, testing, verification', 'Audit report — unqualified, qualified, adverse, disclaimer', 'Internal controls and fraud prevention'], zimbabweContext: 'Zimbabwe has had notable corporate scandals (Interfin Bank, collapsed banks 2000s) — internal audit and governance are highly relevant.' },
  ],
  examPapers: [
    { code: '6001/1', name: 'Paper 1 — Financial Accounting', duration: '3 hours', marks: 120, format: 'Structured questions — prepare accounts, calculate ratios, interpret results' },
    { code: '6001/2', name: 'Paper 2 — Management Accounting', duration: '3 hours', marks: 120, format: 'Costing, budgeting, investment appraisal; show full calculations and interpret results' },
  ],
  studyTips: [
    'Layout is critical in accounting — use proper headings, columns, and underline totals.',
    'Know all variance formulae: standard cost minus actual cost; favourable if actual < standard.',
    'For NPV: always discount all cash flows including terminal value; state discount rate used.',
    'Ratio analysis: always comment on what the ratio means — don\'t just calculate without interpretation.',
    'Group accounts: understand how to eliminate intragroup transactions.',
  ],
  pastPapers: [
    { source: 'ZIMSEC A-Level Accounting Specimen Papers', url: 'https://www5.zimsec.co.zw/download-category/a-level/' },
    { source: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers' },
  ],
}

const ZAL_HISTORY: SubjectCurriculum = {
  subjectId: 'zal-history',
  syllabusCode: '6006',
  level: 'A-Level',
  curriculum: 'ZIMSEC',
  topics: [
    { name: 'Zimbabwe History (Advanced)', subtopics: ['The First Chimurenga (1896-97) — revisionist historiography, oral sources, role of women', 'Nationalism in Zimbabwe 1930-1965 — the role of NDP, ZAPU, ZANU formation', 'The Liberation War 1966-1979 — social history, role of women (e.g., Teurai Ropa Nhongo), external support', 'Lancaster House Conference 1979 — negotiating positions, constraints', 'Post-independence politics 1980-2017 — ZANU-PF dominance, Gukurahundi, land reform, MDC opposition, November 2017 coup'], zimbabweContext: 'A-Level History goes deeper into historiography — students evaluate different historians\' interpretations of Zimbabwe\'s past. Reading Zimbabwean historians like Terence Ranger is important.' },
    { name: 'African History', subtopics: ['Scramble for Africa — Berlin Conference 1884-85; African responses', 'African nationalism 1920s-1960s', 'Pan-Africanism — Nkrumah, UNIA, OAU', 'Decolonisation — different paths (peaceful negotiation vs armed struggle)', 'Apartheid in South Africa — origins, resistance, dismantling', 'Post-independence challenges — neo-colonialism, military coups, one-party states', 'Rwanda Genocide 1994'] },
    { name: 'World History', subtopics: ['World War I — causes, course, consequences for Africa', 'Russian Revolution and rise of communism', 'Rise of fascism — Hitler, Mussolini, World War II', 'Cold War — USA vs USSR; proxy wars in Africa (Angola, Mozambique, Zimbabwe)', 'United Nations and the post-war order', 'Decolonisation as a global movement — India, Vietnam, Algeria'] },
  ],
  examPapers: [
    { code: '6006/1', name: 'Paper 1 — Document Study (Zimbabwe)', duration: '2 hours', marks: 50, format: 'Analyse 5-6 primary/secondary sources on a Zimbabwe history theme; comprehension, inference, cross-reference, reliability, overall judgement' },
    { code: '6006/2', name: 'Paper 2 — Essays', duration: '3 hours', marks: 100, format: 'Four essays: Section A (Zimbabwe), Section B (Africa), Section C (World). Choose one from each section and one optional.' },
  ],
  studyTips: [
    'At A-Level, answers must be analytical — examiners want argument and evaluation, not narration.',
    'Source work: apply HAPP — Historical context, Author/provenance, Purpose, Perspective.',
    'Use historiographical debate — mention different historians\' interpretations for top marks.',
    'Zimbabwe history: know the key events in detail but also understand competing interpretations (e.g., was the land reform justified? Was Gukurahundi genocide?).',
    'Word count matters in essays — aim for 800-1000 words per essay response.',
  ],
  pastPapers: [
    { source: 'ZIMSEC Specimen Papers', url: 'https://www5.zimsec.co.zw/specimen-papers/' },
  ],
}

// ─── Resource index ───────────────────────────────────────────────────────────

export const OFFICIAL_RESOURCES = {
  zimsecWebsite: 'https://www5.zimsec.co.zw',
  syllabusPage: 'https://www5.zimsec.co.zw/syllabi/',
  specimenPapers: 'https://www5.zimsec.co.zw/specimen-papers/',
  oLevelDownloads: 'https://www5.zimsec.co.zw/download-category/o-level/',
  aLevelDownloads: 'https://www5.zimsec.co.zw/download-category/a-level/',
  pastPaperSites: [
    { name: 'Zimsake', url: 'https://zimsake.co.zw/notes/index.php/zimsec-past-exam-papers', description: 'Free ZIMSEC O & A Level past papers 2015-2022, notes, syllabuses' },
    { name: 'Zambuko', url: 'https://zambuko.vercel.app/zimsec', description: 'Green Books (O-Level), A-Level past papers and marking schemes' },
    { name: 'Zimsec Papers (community)', url: 'https://zimsecpapers.github.io/', description: 'Community-shared past exam questions, marking schemes, notes' },
    { name: 'EcoleBooks', url: 'https://www.ecolebooks.com/category/zimsec-o-level-past-exam-papers-pdf-download/', description: 'ZIMSEC past exam paper PDFs' },
  ],
  downloadedSyllabuses: {
    oLevel: [
      { subject: 'Mathematics', file: '/knowledge/syllabuses/o-level/Mathematics_Syllabus.pdf' },
      { subject: 'Physics', file: '/knowledge/syllabuses/o-level/Physics_Forms3-4.pdf' },
      { subject: 'Combined Science', file: '/knowledge/syllabuses/o-level/Combined_Science.pdf' },
      { subject: 'English Language', file: '/knowledge/syllabuses/o-level/English_Language.pdf' },
      { subject: 'History', file: '/knowledge/syllabuses/o-level/History.pdf' },
      { subject: 'Geography', file: '/knowledge/syllabuses/o-level/Geography.pdf' },
      { subject: 'Economics', file: '/knowledge/syllabuses/o-level/Economics_Forms1-4.pdf' },
      { subject: 'Accounting', file: '/knowledge/syllabuses/o-level/Accounting_Forms1-4.pdf' },
      { subject: 'Computer Science', file: '/knowledge/syllabuses/o-level/Computer_Science.pdf' },
      { subject: 'Agriculture', file: '/knowledge/syllabuses/o-level/Agriculture_Forms1-4.pdf' },
      { subject: 'Biology', file: '/knowledge/syllabuses/o-level/Biology.pdf' },
      { subject: 'Statistics', file: '/knowledge/syllabuses/o-level/Statistics.pdf' },
      { subject: 'Additional Mathematics', file: '/knowledge/syllabuses/o-level/Additional_Mathematics.pdf' },
      { subject: 'Pure Mathematics (Forms 3-4)', file: '/knowledge/syllabuses/o-level/Pure_Mathematics_Forms3-4.pdf' },
      { subject: 'Commerce', file: '/knowledge/syllabuses/o-level/Commerce_Forms1-4.pdf' },
      { subject: 'Sociology', file: '/knowledge/syllabuses/o-level/Sociology.pdf' },
      { subject: 'Food Technology', file: '/knowledge/syllabuses/o-level/Food_Technology.pdf' },
      { subject: 'Commercial Studies', file: '/knowledge/syllabuses/o-level/Commercial_Studies_Forms1-4.pdf' },
      { subject: 'Design & Technology', file: '/knowledge/syllabuses/o-level/Design_Technology.pdf' },
      { subject: 'Home Management', file: '/knowledge/syllabuses/o-level/Home_Management.pdf' },
      { subject: 'Literature in English', file: '/knowledge/syllabuses/o-level/Literature_English.pdf' },
      { subject: 'Business Enterprise', file: '/knowledge/syllabuses/o-level/Business_Enterprise.pdf' },
    ],
  },
}

// ─── Lookup map ───────────────────────────────────────────────────────────────

const CURRICULUM_MAP: Record<string, SubjectCurriculum> = {
  'zol-mathematics':       ZOL_MATHEMATICS,
  'zol-physics':           ZOL_PHYSICS,
  'zol-chemistry':         ZOL_CHEMISTRY,
  'zol-biology':           ZOL_BIOLOGY,
  'zol-combined-science':  ZOL_COMBINED_SCIENCE,
  'zol-english-language':  ZOL_ENGLISH,
  'zol-history':           ZOL_HISTORY,
  'zol-geography':         ZOL_GEOGRAPHY,
  'zol-accounts':          ZOL_ACCOUNTS,
  'zol-commerce':          ZOL_COMMERCE,
  'zol-agriculture':       ZOL_AGRICULTURE,
  'zol-computer-science':  ZOL_COMPUTER_SCIENCE,
  'zal-pure-mathematics':  ZAL_PURE_MATHS,
  'zal-physics':           ZAL_PHYSICS,
  'zal-chemistry':         ZAL_CHEMISTRY,
  'zal-biology':           ZAL_BIOLOGY,
  'zal-economics':         ZAL_ECONOMICS,
  'zal-accounting':        ZAL_ACCOUNTING,
  'zal-history':           ZAL_HISTORY,
}

export function getSubjectCurriculum(subjectId: string): SubjectCurriculum | undefined {
  return CURRICULUM_MAP[subjectId]
}

// Builds a rich context string for the AI companion system prompt
export function buildCurriculumContext(subjectId: string): string {
  const curriculum = CURRICULUM_MAP[subjectId]
  if (!curriculum) return ''

  const topicList = curriculum.topics.map(t =>
    `• ${t.name}: ${t.subtopics.join(', ')}${t.zimbabweContext ? ` [Zimbabwe context: ${t.zimbabweContext}]` : ''}`
  ).join('\n')

  const papers = curriculum.examPapers.map(p =>
    `${p.code} — ${p.name} (${p.duration}, ${p.marks} marks): ${p.format}`
  ).join('\n')

  const tips = curriculum.studyTips.map((t, i) => `${i + 1}. ${t}`).join('\n')

  return `
SUBJECT: ${curriculum.syllabusCode} | ${curriculum.level} | ${curriculum.curriculum}

SYLLABUS TOPICS:
${topicList}

EXAM FORMAT:
${papers}

STUDY TIPS FOR THIS SUBJECT:
${tips}

PAST PAPER RESOURCES: ${curriculum.pastPapers.map(p => p.source).join(', ')}
${curriculum.syllabusFile ? `SYLLABUS PDF: Available at ${curriculum.syllabusFile}` : ''}
`.trim()
}

export const ALL_CURRICULUM_IDS = Object.keys(CURRICULUM_MAP)
