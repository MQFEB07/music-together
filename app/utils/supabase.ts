import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Realtime sync is disabled.')
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}
