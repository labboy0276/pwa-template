import { beforeEach, describe, expect, it } from 'vitest'
import { createStore } from './store'

// Example test suite — also the real regression test for the store. With no
// Supabase env set in tests, createStore exercises the localStorage path.

beforeEach(() => {
  localStorage.clear()
})

describe('createStore', () => {
  it('starts from the initial value when nothing is stored', () => {
    const s = createStore('count', 0)
    expect(s.get()).toBe(0)
    s.destroy()
  })

  it('set and update mutate the value', () => {
    const s = createStore<number>('count', 0)
    s.set(5)
    expect(s.get()).toBe(5)
    s.update((n) => n + 1)
    expect(s.get()).toBe(6)
    s.destroy()
  })

  it('persists to localStorage and a fresh store reloads it', () => {
    const a = createStore<string[]>('items', [])
    a.set(['milk', 'eggs'])
    expect(JSON.parse(localStorage.getItem('items')!)).toEqual(['milk', 'eggs'])
    a.destroy()

    const b = createStore<string[]>('items', [])
    expect(b.get()).toEqual(['milk', 'eggs'])
    b.destroy()
  })

  it('notifies subscribers immediately and on every change', () => {
    const s = createStore('n', 1)
    const seen: number[] = []
    const unsubscribe = s.subscribe((v) => seen.push(v))
    expect(seen).toEqual([1]) // called immediately with the current value

    s.set(2)
    expect(seen).toEqual([1, 2])

    unsubscribe()
    s.set(3)
    expect(seen).toEqual([1, 2]) // no callbacks after unsubscribe
    s.destroy()
  })

  it('falls back to the initial value when stored JSON is malformed', () => {
    localStorage.setItem('broken', '{not json')
    const s = createStore('broken', { ok: true })
    expect(s.get()).toEqual({ ok: true })
    s.destroy()
  })
})
