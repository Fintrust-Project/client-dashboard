import { createClient } from '@supabase/supabase-js'

// Next.js requires literal process.env.NEXT_PUBLIC_... for static replacement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)

// Use placeholders only during build-time to avoid crashes
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder'

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.warn('Supabase environment variables are missing! Auth and data will not function until .env is verified.')
    }
}

if (typeof window !== 'undefined') {
    console.log('Supabase Initialized with URL:', finalUrl === 'https://placeholder.supabase.co' ? 'PLACEHOLDER (ERROR)' : 'VALID URL')
}

export const supabase = createClient(finalUrl, finalKey)
