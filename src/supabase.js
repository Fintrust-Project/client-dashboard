import { createClient } from '@supabase/supabase-js'

// Next.js uses process.env, Vite uses import.meta.env
const supabaseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
const supabaseAnonKey = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)

// We use fallback values during build-time prerendering to prevent 'supabaseUrl is required' errors.
// These will be overridden by the real values once the app loads in the browser.
const finalUrl = supabaseUrl || 'https://tmp-placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'tmp-placeholder'

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.warn('Supabase environment variables are missing! Auth and data will not function until .env is verified.')
    }
}

export const supabase = createClient(finalUrl, finalKey)
