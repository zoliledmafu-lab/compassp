export type Language = 'en' | 'sn' | 'nd'

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  sn: 'Shona',
  nd: 'Ndebele',
}

export const LANGUAGE_AI_INSTRUCTION: Record<Language, string> = {
  en: '',
  sn: 'LANGUAGE: You must respond entirely in chiShona (Shona). Write your full response in Shona. Mathematical and scientific terms without a Shona equivalent (like "gradient", "radius", "pH", "atom") may remain in English, but all explanations, encouragement and questions must be in Shona.',
  nd: 'LANGUAGE: You must respond entirely in isiNdebele (Ndebele). Write your full response in isiNdebele. Mathematical and scientific terms without an Ndebele equivalent (like "gradient", "radius", "pH", "atom") may remain in English, but all explanations, encouragement and questions must be in isiNdebele.',
}

export interface Translations {
  // Nav
  nav_dashboard: string
  nav_chat: string
  nav_canvas: string
  nav_subjects: string
  nav_learn: string
  nav_progress: string
  nav_rules: string
  nav_students: string
  nav_analytics: string
  // Sidebar
  sidebar_study_companion: string
  sidebar_admin_console: string
  sidebar_sign_out: string
  // Dashboard greetings
  dash_greeting_morning: string
  dash_greeting_afternoon: string
  dash_greeting_evening: string
  dash_ready: string
  dash_add_subjects_prompt: string
  // Stats
  dash_stat_streak: string
  dash_stat_subjects: string
  dash_stat_sessions: string
  dash_stat_concepts: string
  // Action cards
  dash_action_start_title: string
  dash_action_start_desc: string
  dash_action_start_cta: string
  dash_action_canvas_title: string
  dash_action_canvas_desc: string
  dash_action_canvas_cta: string
  dash_action_subjects_title: string
  dash_action_subjects_desc: string
  dash_action_subjects_cta: string
  // Subjects section
  dash_your_subjects: string
  dash_add_subjects: string
  dash_no_subjects: string
  dash_no_subjects_sub: string
  // Language picker label
  lang_label: string
}

export const translations: Record<Language, Translations> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_chat: 'Study Chat',
    nav_canvas: 'Study Canvas',
    nav_subjects: 'Subjects',
    nav_learn: 'Interactive Learn',
    nav_progress: 'My Progress',
    nav_rules: 'Rule Engine',
    nav_students: 'Students',
    nav_analytics: 'Analytics',
    sidebar_study_companion: 'Study Companion',
    sidebar_admin_console: 'Admin Console',
    sidebar_sign_out: 'Sign out',
    dash_greeting_morning: 'Good morning',
    dash_greeting_afternoon: 'Good afternoon',
    dash_greeting_evening: 'Good evening',
    dash_ready: 'Ready to make progress today?',
    dash_add_subjects_prompt: 'Add your subjects to get started.',
    dash_stat_streak: 'Study streak',
    dash_stat_subjects: 'Subjects added',
    dash_stat_sessions: 'Total sessions',
    dash_stat_concepts: 'Concepts explored',
    dash_action_start_title: 'Start Studying',
    dash_action_start_desc: 'Ask questions, work through problems with AI guidance',
    dash_action_start_cta: 'Open Chat',
    dash_action_canvas_title: 'Study Canvas',
    dash_action_canvas_desc: 'Build mind maps, organise your revision notes',
    dash_action_canvas_cta: 'Open Canvas',
    dash_action_subjects_title: 'Browse Subjects',
    dash_action_subjects_desc: 'Explore your full curriculum — all subjects in one place',
    dash_action_subjects_cta: 'View Subjects',
    dash_your_subjects: 'Your Subjects',
    dash_add_subjects: 'Add subjects',
    dash_no_subjects: 'No subjects yet',
    dash_no_subjects_sub: 'Add the subjects you\'re studying to track your progress here.',
    lang_label: 'Language',
  },

  sn: {
    nav_dashboard: 'Dhashibhodi',
    nav_chat: 'Nhaurirano',
    nav_canvas: 'Kanivhasi',
    nav_subjects: 'Zvidzidzo',
    nav_learn: 'Kudzidza Kusimba',
    nav_progress: 'Budiriro Yangu',
    nav_rules: 'Rule Engine',
    nav_students: 'Vadzidzi',
    nav_analytics: 'Ongororo',
    sidebar_study_companion: 'Shamwari yeKudzidza',
    sidebar_admin_console: 'Dheski reAdmin',
    sidebar_sign_out: 'Buda',
    dash_greeting_morning: 'Mangwanani',
    dash_greeting_afternoon: 'Masikati',
    dash_greeting_evening: 'Manheru',
    dash_ready: 'Wagadzirira kubudirira nhasi?',
    dash_add_subjects_prompt: 'Wedzera zvidzidzo zvako kutanga.',
    dash_stat_streak: 'Nguva yokudzidza',
    dash_stat_subjects: 'Zvidzidzo zvakawedzerwa',
    dash_stat_sessions: 'Marongero ese',
    dash_stat_concepts: 'Pfungwa dzakaonekwa',
    dash_action_start_title: 'Tanga Kudzidza',
    dash_action_start_desc: 'Bvunza mibvunzo, shanda pamaproblem neAI yako',
    dash_action_start_cta: 'Vhura Nhaurirano',
    dash_action_canvas_title: 'Kanivhasi',
    dash_action_canvas_desc: 'Gadzira mapurani, rongedza zvinyorwa zvako',
    dash_action_canvas_cta: 'Vhura Kanivhasi',
    dash_action_subjects_title: 'Tsvaka Zvidzidzo',
    dash_action_subjects_desc: 'Ongorora zvidzidzo zvako zvese panzvimbo imwe',
    dash_action_subjects_cta: 'Ona Zvidzidzo',
    dash_your_subjects: 'Zvidzidzo Zvako',
    dash_add_subjects: 'Wedzera zvidzidzo',
    dash_no_subjects: 'Hapana zvidzidzo',
    dash_no_subjects_sub: 'Wedzera zvidzidzo zvaunodzidza kutevedza budiriro yako pano.',
    lang_label: 'Mutauro',
  },

  nd: {
    nav_dashboard: 'Ibhodi',
    nav_chat: 'Ingxoxo',
    nav_canvas: 'Icanvas',
    nav_subjects: 'Izifundo',
    nav_learn: 'Ukufunda Okukhuthazayo',
    nav_progress: 'Intuthuko Yami',
    nav_rules: 'Rule Engine',
    nav_students: 'Abafundi',
    nav_analytics: 'Ukuhlaziywa',
    sidebar_study_companion: 'Umngane wokufunda',
    sidebar_admin_console: 'Ikhonsoli yomlawuli',
    sidebar_sign_out: 'Phuma',
    dash_greeting_morning: 'Livuke njani',
    dash_greeting_afternoon: 'Sawubona',
    dash_greeting_evening: 'Lilale njani',
    dash_ready: 'Ulungele ukuqhubeka namuhla?',
    dash_add_subjects_prompt: 'Engeza izifundo zakho ukuqala.',
    dash_stat_streak: 'Isikhathi sokufunda',
    dash_stat_subjects: 'Izifundo ezengeziwe',
    dash_stat_sessions: 'Izikhathi zonke',
    dash_stat_concepts: 'Imibono ehlolwe',
    dash_action_start_title: 'Qala Ukufunda',
    dash_action_start_desc: 'Buza imibuzo, sebenza ngezinkinga ngeAI yakho',
    dash_action_start_cta: 'Vula Ingxoxo',
    dash_action_canvas_title: 'Icanvas',
    dash_action_canvas_desc: 'Yakha imindeni, hlela amanothi akho',
    dash_action_canvas_cta: 'Vula Icanvas',
    dash_action_subjects_title: 'Hlola Izifundo',
    dash_action_subjects_desc: 'Hlola izifundo zakho zonke ndawonye',
    dash_action_subjects_cta: 'Bona Izifundo',
    dash_your_subjects: 'Izifundo Zakho',
    dash_add_subjects: 'Engeza izifundo',
    dash_no_subjects: 'Azikho izifundo',
    dash_no_subjects_sub: 'Engeza izifundo ofunda zona ukuze ulandele intuthuko yakho lapha.',
    lang_label: 'Ulimi',
  },
}
