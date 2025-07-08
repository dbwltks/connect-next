import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgmxfgxkqmzjvydhrglg.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbXhmZ3hrcW16anZ5ZGhyZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MjMwMjgsImV4cCI6MjA1OTA5OTAyOH0.HRU7T-4RwUzd4pT8OLAUKiyoyZrTSr8CHo4YeBcQoRg'
  
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseAnonKey ? 'Loaded' : 'Missing')
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}
