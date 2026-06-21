// A tiny reactive store with three layers of persistence:
//
//   1. localStorage — an instant, offline cache (the app opens immediately and
//      keeps working with no signal).
//   2. Supabase    — the synced source of truth, private to the signed-in user.
//   3. realtime    — pushes changes to your other signed-in devices live.
//
// The public API (createStore -> get/set/update/subscribe) is unchanged, so the
// rest of the app doesn't know or care that data syncs. When Supabase isn't
// configured (no .env), it silently degrades to localStorage-only behaviour.

import type { RealtimeChannel } from '@supabase/supabase-js'
import { APP_ID, supabase } from './supabase'

type Listener<T> = (value: T) => void

export interface Store<T> {
  get(): T
  set(value: T): void
  update(fn: (value: T) => T): void
  /** Calls listener immediately with the current value, returns an unsubscribe. */
  subscribe(listener: Listener<T>): () => void
  /** Stop listening for cross-tab/realtime updates and drop all subscribers. */
  destroy(): void
}

export function createStore<T>(key: string, initial: T): Store<T> {
  let value = loadCache(key, initial)
  const listeners = new Set<Listener<T>>()

  function notify() {
    for (const l of listeners) l(value)
  }

  // Apply a value that arrived from elsewhere (server fetch, realtime, another
  // tab): update the cache and notify, but never echo it back to the server.
  function applyRemote(next: T) {
    value = next
    saveCache(key, value)
    notify()
  }

  // --- cross-tab sync on the same device ---
  function onStorage(e: StorageEvent) {
    if (e.key !== key || e.newValue === null) return
    try {
      applyRemote(JSON.parse(e.newValue) as T)
    } catch {
      /* ignore a malformed value from another writer */
    }
  }
  window.addEventListener('storage', onStorage)

  // --- Supabase: hydrate once, then live-sync ---
  let channel: RealtimeChannel | null = null
  if (supabase) {
    void supabase
      .from('kv')
      .select('value')
      .eq('app', APP_ID)
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        // No row yet (new user) -> keep local data; the first save creates it.
        if (data) applyRemote(data.value as T)
      })

    channel = supabase
      .channel(`kv:${APP_ID}:${key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv',
          filter: `app=eq.${APP_ID}`,
        },
        (payload) => {
          const row = payload.new as { key?: string; value?: T } | null
          if (row && row.key === key && 'value' in row) {
            applyRemote(row.value as T)
          }
        },
      )
      .subscribe()
  }

  async function persist(next: T) {
    saveCache(key, next)
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return // signed out — the cache still holds the change
    const { error } = await supabase
      .from('kv')
      .upsert(
        { user_id: userId, app: APP_ID, key, value: next },
        { onConflict: 'user_id,app,key' },
      )
    if (error) console.warn(`[store] sync failed for "${key}":`, error.message)
  }

  return {
    get: () => value,
    set(next) {
      value = next
      notify()
      void persist(next)
    },
    update(fn) {
      value = fn(value)
      notify()
      void persist(value)
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(value)
      return () => {
        listeners.delete(listener)
      }
    },
    destroy() {
      window.removeEventListener('storage', onStorage)
      void channel?.unsubscribe()
      listeners.clear()
    },
  }
}

// --- local cache (instant load + offline) ------------------------------------
// Each app is its own origin, so the bare key never collides across apps.

function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable or full — safe to ignore for a local-first app.
  }
}
