import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey, isConfigured } from './supabaseConfig'

let supabase = null

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

export function createEphemeralClient() {
  if (!isConfigured) return null
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}