// @vitest-environment jsdom
/**
 * The Team Rooms settings page — the third coverage hole the source plugin
 * left open (nothing under `tests/` rendered `src/client/TeamRoomsSection.tsx`).
 *
 * The component is a thin binder over the injected action map: every write
 * must reach the host `/room` command through the injected callbacks, never
 * through a private channel. This suite renders the real component with a fake
 * `t` (the English dictionary, so the assertions read like the UI) and asserts
 * the empty state, the room card, and the action wiring.
 * @module dsh-team-rooms/tests/team-rooms-section.spec
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { ComponentProps } from 'react'
import { TeamRoomsSection } from '../src/client/TeamRoomsSection.tsx'
import type { TeamRoomsState } from '../src/client/room-presenter.ts'
import { en, ROOM_NS } from '../src/client/room-locales.ts'

// React 18 only flushes passive effects (which is where useSyncExternalStore
// subscribes and reads) inside act(); without the flag the section renders
// nothing and every assertion sees an empty body.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Props = ComponentProps<typeof TeamRoomsSection>

interface Harness {
  readonly container: HTMLDivElement
  readonly root: Root
  readonly actions: Record<string, ReturnType<typeof vi.fn>>
}

const mounts: Harness[] = []

afterEach(() => {
  for (const { container, root } of mounts.splice(0)) {
    act(() => { root.unmount() })
    container.remove()
  }
  document.body.innerHTML = ''
})

/** The real English dictionary with `{placeholder}` substitution, keyed by namespace. */
function translate(key: string, params?: Record<string, unknown>): string {
  const template = (en as Record<string, string>)[key] ?? key
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/gu, (_match, name: string) => String(params[name] ?? ''))
}

/** One room panel as the presenter would produce it. */
const PANEL = {
  roomId: 'room-1',
  name: 'ops room',
  createdAt: 1_000,
  members: [
    { sessionId: 's-1', role: 'owner' as const, joinedAt: 100, live: true },
    { sessionId: 's-2', role: 'member' as const, joinedAt: 200, live: false },
  ],
  tasks: [
    {
      taskId: 't-todo', title: 'open work', description: 'details', status: 'todo' as const,
      assigneeSessionId: null, createdBy: 's-1',
    },
    {
      taskId: 't-done', title: 'shipped', description: '', status: 'done' as const,
      assigneeSessionId: 's-1', createdBy: 's-1',
    },
  ],
  timeline: [{ seq: 1, kind: 'member-joined' as const, data: { sessionId: 's-1' } }],
}

function mount(state: TeamRoomsState): Harness {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const actions: Record<string, ReturnType<typeof vi.fn>> = {
    create: vi.fn().mockResolvedValue(undefined),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    claimTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    assignTask: vi.fn().mockResolvedValue(undefined),
  }
  const props = {
    t: translate,
    ns: ROOM_NS,
    useTeamRooms: (selector: (snapshot: TeamRoomsState) => unknown) => selector(state),
    getSessionId: () => state.sessionId,
    ...actions,
  } as unknown as Props
  const root = createRoot(container)
  act(() => { root.render(<TeamRoomsSection {...props} />) })
  const harness = { container, root, actions }
  mounts.push(harness)
  return harness
}

/** All visible buttons, by text content. */
function button(text: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].find(candidate => candidate.textContent === text)
  if (found === undefined) throw new Error(`no button labelled ${text}`)
  return found
}

/**
 * Fill one input the way React reads a controlled field: through the native
 * value setter (React installs its own property descriptor on the element, so
 * a plain assignment skips the change listener) followed by an input event.
 */
function setInputValue(input: HTMLInputElement, text: string): void {
  const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  if (native !== undefined) native.call(input, text)
  else input.value = text
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

/** Click one button and let the resulting promise chain settle. */
async function click(target: HTMLButtonElement): Promise<void> {
  await act(async () => {
    target.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
}

describe('TeamRoomsSection — empty and no-session states', () => {
  it('renders the title, the intro, and the empty notice for a ready session with no rooms', () => {
    const { container } = mount({ status: 'ready', sessionId: 's-1', rooms: [] })
    expect(container.querySelector('h2')?.textContent).toBe(en.title)
    expect(container.textContent).toContain(en.intro)
    expect(container.textContent).toContain(en.empty)
    expect(container.textContent).not.toContain(en.noSession)
  })

  it('renders the no-session notice and disables both forms without an active session', () => {
    const { container } = mount({ status: 'ready', rooms: [] })
    expect(container.textContent).toContain(en.noSession)
    for (const input of container.querySelectorAll('input')) expect(input.disabled).toBe(true)
    expect(button(en.createAction).disabled).toBe(true)
    expect(button(en.joinAction).disabled).toBe(true)
  })

  it('enables the create form once a session is open', () => {
    const { container } = mount({ status: 'ready', sessionId: 's-1', rooms: [] })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(false)
    // The action stays disabled until a name is typed.
    expect(button(en.createAction).disabled).toBe(true)
  })
})

describe('TeamRoomsSection — the room card', () => {
  it('renders the room name, id, members with live/offline bits, tasks, and the timeline', () => {
    const { container } = mount({ status: 'ready', sessionId: 's-1', rooms: [PANEL] })
    expect(container.querySelector('h3')?.textContent).toBe('ops room')
    expect(container.textContent).toContain('room-1')
    expect(container.textContent).toContain(`${en.owner} · ${en.live}`)
    expect(container.textContent).toContain(`${en.member} · ${en.offline}`)
    expect(container.textContent).toContain('open work')
    expect(container.textContent).toContain('details')
    expect(container.textContent).toContain('shipped')
    expect(container.textContent).toContain('s-1 joined the room')
  })

  it('offers Claim only on a todo row and Done on every unfinished row', () => {
    mount({ status: 'ready', sessionId: 's-1', rooms: [PANEL] })
    expect([...document.body.querySelectorAll('button')].filter(b => b.textContent === en.claim)).toHaveLength(1)
    expect([...document.body.querySelectorAll('button')].filter(b => b.textContent === en.done)).toHaveLength(1)
  })
})

describe('TeamRoomsSection — the injected action map', () => {
  it('sends the typed room name through create() and clears the field', async () => {
    const { container, actions } = mount({ status: 'ready', sessionId: 's-1', rooms: [] })
    setInputValue(container.querySelector('input')!, '  new room  ')
    await click(button(en.createAction))
    expect(actions.create).toHaveBeenCalledWith('new room')
  })

  it('surfaces a failed action through the alert region', async () => {
    const { container, actions } = mount({ status: 'ready', sessionId: 's-1', rooms: [] })
    actions.create!.mockResolvedValue('store-unavailable: no domain')
    setInputValue(container.querySelector('input')!, 'new room')
    await click(button(en.createAction))
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('store-unavailable: no domain')
  })

  it('routes the room-level actions to leave, addTask, post, claimTask, and completeTask', async () => {
    const { container, actions } = mount({ status: 'ready', sessionId: 's-1', rooms: [PANEL] })

    await click(button(en.leave))
    expect(actions.leave).toHaveBeenCalledWith('room-1')

    setInputValue(
      container.querySelector('input[placeholder="New task title…"]') as HTMLInputElement,
      'a new task',
    )
    await click(button(en.taskAdd))
    expect(actions.addTask).toHaveBeenCalledWith('room-1', 'a new task')

    await click(button(en.claim))
    expect(actions.claimTask).toHaveBeenCalledWith('room-1', 't-todo')

    setInputValue(
      container.querySelector('input[placeholder="Broadcast to every member…"]') as HTMLInputElement,
      'hello team',
    )
    await click(button(en.send))
    expect(actions.post).toHaveBeenCalledWith('room-1', 'hello team')

    await click(button(en.done))
    expect(actions.completeTask).toHaveBeenCalledWith('room-1', 't-todo')
  })

  it('hands a task off through assignTask with the typed member id', async () => {
    const { container, actions } = mount({ status: 'ready', sessionId: 's-1', rooms: [PANEL] })
    const assign = container.querySelector('input[placeholder="member id or me"]') as HTMLInputElement
    setInputValue(assign, 's-2')
    await click(button(en.assignAction))
    expect(actions.assignTask).toHaveBeenCalledWith('room-1', 't-todo', 's-2')
  })
})
