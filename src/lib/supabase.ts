import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import appCfg from '../../app.config.json'

// Supabase credentials come from .env (see .env.example). Both values are
// publishable client keys — security comes from row-level security, not from
// hiding them. If they're absent, the app falls back to local-only storage,
// so a freshly scaffolded app runs offline-only until you wire Supabase up.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Stable namespace for this app's rows in the shared `kv` table. */
export const APP_ID = appCfg.name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

/** True when Supabase is configured; otherwise the app runs local-only. */
export const hasSupabase = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string)
  : null
