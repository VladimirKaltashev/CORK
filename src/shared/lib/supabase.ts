import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Connection check — remove after confirming connectivity
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('[Supabase] Connection error:', error.message)
  } else {
    console.log('[Supabase] Connected ✓  session:', data.session?.user?.email ?? 'no active session')
  }
})
