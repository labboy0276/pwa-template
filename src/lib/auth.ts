import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Magic-link sign-in. The session persists in localStorage, so this is a
// once-per-device step. Personal data requires knowing *who* you are, which is
// why every signed-in user only ever sees their own rows (enforced by RLS).
// If your app's data should be shared rather than per-person, change the RLS
// policy in supabase/schema.sql (see the comment there).

/**
 * Return the current session, or render the sign-in screen and return null.
 * When the emailed link establishes a session, the page reloads into the app.
 */
export async function ensureAuth(root: HTMLElement): Promise<Session | null> {
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session

  renderLogin(root)
  // If the link is opened in this same tab, reload once the session lands.
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) location.reload()
  })
  return null
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
  location.reload()
}

/** A small, unobtrusive "Sign out" control (skipped when running local-only). */
export function mountSignOut(): void {
  if (!supabase) return
  const btn = document.createElement('button')
  btn.className = 'sign-out'
  btn.type = 'button'
  btn.textContent = 'Sign out'
  btn.addEventListener('click', () => void signOut())
  document.body.appendChild(btn)
}

function renderLogin(root: HTMLElement): void {
  root.innerHTML = `
    <div class="auth">
      <form id="auth-form" class="auth-card">
        <h1>Sign in</h1>
        <p>Enter your email and we'll send a one-tap sign-in link.</p>
        <input
          id="auth-email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
        <button type="submit">Send link</button>
        <p id="auth-msg" class="auth-msg" hidden></p>
      </form>
    </div>
  `

  const form = root.querySelector<HTMLFormElement>('#auth-form')!
  const email = root.querySelector<HTMLInputElement>('#auth-email')!
  const msg = root.querySelector<HTMLParagraphElement>('#auth-msg')!
  const button = form.querySelector('button')!

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const address = email.value.trim()
    if (!address) return

    button.disabled = true
    show(msg, 'Sending…')

    const { error } = await supabase!.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: location.origin },
    })

    if (error) {
      button.disabled = false
      show(msg, error.message)
    } else {
      show(msg, `Check ${address} for a sign-in link.`)
    }
  })
}

function show(el: HTMLElement, text: string): void {
  el.textContent = text
  el.hidden = false
}
