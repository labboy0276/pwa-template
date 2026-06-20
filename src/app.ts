import app from '../app.config.json'
import { createStore } from './lib/store'

// ---------------------------------------------------------------------------
// Demo app: a simple persisted checklist. Delete this and build your own —
// it's here to prove the store, offline caching and install flow all work.
// ---------------------------------------------------------------------------

interface Item {
  id: string
  text: string
  done: boolean
}

const items = createStore<Item[]>('items', [])

export function mountApp(root: HTMLElement) {
  root.innerHTML = `
    <header class="header">
      <h1>${app.name}</h1>
    </header>

    <main class="main">
      <form id="add-form" class="add-form">
        <input
          id="add-input"
          class="add-input"
          placeholder="Add an item…"
          autocomplete="off"
          enterkeyhint="done"
        />
        <button class="add-btn" type="submit" aria-label="Add item">+</button>
      </form>

      <ul id="list" class="list"></ul>
      <p id="empty" class="empty">Nothing here yet — add something above.</p>
    </main>
  `

  const form = root.querySelector<HTMLFormElement>('#add-form')!
  const input = root.querySelector<HTMLInputElement>('#add-input')!
  const list = root.querySelector<HTMLUListElement>('#list')!
  const empty = root.querySelector<HTMLParagraphElement>('#empty')!

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return
    items.update((cur) => [
      ...cur,
      { id: crypto.randomUUID(), text, done: false },
    ])
    input.value = ''
    input.focus()
  })

  // One delegated listener handles both toggling and deleting.
  list.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const row = target.closest<HTMLElement>('[data-id]')
    if (!row) return
    const id = row.dataset.id!

    if (target.classList.contains('delete')) {
      items.update((cur) => cur.filter((i) => i.id !== id))
    } else {
      items.update((cur) =>
        cur.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
      )
    }
  })

  // Re-render whenever the data changes (including on first load).
  items.subscribe((cur) => {
    empty.hidden = cur.length > 0
    list.innerHTML = cur
      .map(
        (i) => `
        <li class="item ${i.done ? 'is-done' : ''}" data-id="${i.id}">
          <span class="check" aria-hidden="true">${i.done ? '✓' : ''}</span>
          <span class="text">${escapeHtml(i.text)}</span>
          <button class="delete" aria-label="Delete">×</button>
        </li>`,
      )
      .join('')
  })
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c]!,
  )
}
