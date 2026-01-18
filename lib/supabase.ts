import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase non configurato. Usa localStorage come fallback.')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Tipi TypeScript per le tabelle
export interface CleaningProgress {
  id: string
  week_id: number
  area_id: string
  completed_by: string
  completed_at: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_name: string
  display_name?: string
  avatar_url?: string
  color_preference: Record<string, string>
  theme_preference: 'light' | 'dark'
  language_preference: 'it' | 'en'
  updated_at: string
}
