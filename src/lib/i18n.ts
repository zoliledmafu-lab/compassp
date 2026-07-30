export type Language = 'en'

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
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
  // Admin — Students
  admin_students_title: string
  admin_students_desc: string
  admin_search: string
  admin_col_student: string
  admin_col_subjects: string
  admin_col_sessions: string
  admin_col_last_active: string
  admin_no_students: string
  admin_no_students_sub: string
  // Admin — Analytics
  admin_analytics_title: string
  admin_analytics_desc: string
  admin_stat_active: string
  admin_stat_sessions: string
  admin_stat_avg: string
  admin_stat_attempts: string
  admin_sessions_by_subject: string
  admin_attempts_log: string
  admin_no_data: string
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
    admin_students_title: 'Students',
    admin_students_desc: 'Students registered at your school',
    admin_search: 'Search students…',
    admin_col_student: 'Student',
    admin_col_subjects: 'Subjects',
    admin_col_sessions: 'Sessions',
    admin_col_last_active: 'Last active',
    admin_no_students: 'No students yet',
    admin_no_students_sub: 'Students who register under your school name will appear here.',
    admin_analytics_title: 'Analytics',
    admin_analytics_desc: 'School-wide usage data. Not visible to students.',
    admin_stat_active: 'Active students',
    admin_stat_sessions: 'Total sessions',
    admin_stat_avg: 'Avg. session length',
    admin_stat_attempts: 'Direct answer attempts',
    admin_sessions_by_subject: 'Sessions by Subject',
    admin_attempts_log: 'Direct Answer Attempts (last 7 days)',
    admin_no_data: 'No data yet — usage will appear here once students start sessions.',
  },
}
