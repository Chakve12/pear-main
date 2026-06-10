const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://jnwbydftnnkwdzvvvpfg.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JvBAZK8doOYhW1wIWkYN6A_9R-2MGci'

const isPlaceholder = (v) =>
  !v ||
  v === 'undefined' ||
  String(v).trim() === '' ||
  String(v).startsWith('your_')

const isConfigured =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey, isConfigured }
