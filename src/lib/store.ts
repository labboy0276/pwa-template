// A tiny reactive, persisted store — enough state management for a small PWA
// without pulling in a framework.
//
// Today it persists to localStorage (local-only, per device). When an app
// needs to sync between phones, you only touch the two functions at the
// bottom (`load` / `save`) — swap them for fetch() calls to your backend
// (Netlify/Vercel function, Supabase, etc.). Everything above stays the same.

type Listener<T> = (value: T) => void

export interface Store<T> {
  get(): T
  set(value: T): void
  update(fn: (value: T) => T): void
  /** Calls listener immediately with the current value, returns an unsubscribe. */
  subscribe(listener: Listener<T>): () => void
}

export function createStore<T>(key: string, initial: T): Store<T> {
  let value = load(key, initial)
  const listeners = new Set<Listener<T>>()

  function emit() {
    save(key, value)
    for (const l of listeners) l(value)
  }

  // Keep other open tabs / windows of the same app in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === key && e.newValue) {
      value = JSON.parse(e.newValue) as T
      for (const l of listeners) l(value)
    }
  })

  return {
    get: () => value,
    set(next) {
      value = next
      emit()
    },
    update(fn) {
      value = fn(value)
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      listener(value)
      return () => listeners.delete(listener)
    },
  }
}

// --- persistence seam --------------------------------------------------------
// Replace these to add cross-device sync later.

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable or full — safe to ignore for a local-first app.
  }
}
