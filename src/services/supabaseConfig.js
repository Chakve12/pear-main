const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isPlaceholder = (v) =>
  !v ||
  v === 'undefined' ||
  String(v).trim() === '' ||
  String(v).startsWith('your_')

const isConfigured =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey, isConfigured }
