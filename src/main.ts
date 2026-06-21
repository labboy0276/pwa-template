import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { hasSupabase } from './lib/supabase'
import { ensureAuth, mountSignOut } from './lib/auth'

// Register the service worker (offline support + auto-updates).
registerSW({ immediate: true })

const root = document.getElementById('app')!

async function boot() {
  // When Supabase is configured, require a signed-in session before the app
  // loads. The app module is imported dynamically so its store (and its sync)
  // only spin up once we know who the user is.
  if (hasSupabase) {
    const session = await ensureAuth(root)
    if (!session) return // the sign-in screen is showing
  }

  const { mountApp } = await import('./app')
  mountApp(root)
  mountSignOut()
}

void boot()
