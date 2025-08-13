import { createClient } from '@supabase/supabase-js'

// Debug all environment variables
console.log('All Vite environment variables:', import.meta.env)
console.log('All environment variables:', Object.keys(import.meta.env))

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Environment variables check:')
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
  throw new Error('Missing Supabase environment variables. Please check your .env.local file')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  WORKOUT_FOLDERS: 'workout_folders',
  WORKOUT_ROUTINES: 'workout_routines',
  EXERCISES: 'exercises',
  EXERCISE_LOGS: 'exercise_logs'
} 