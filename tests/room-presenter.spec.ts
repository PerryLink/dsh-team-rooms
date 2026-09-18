/**
 * The pure room presenter — the second coverage hole the source plugin left
 * open (nothing under `tests/` imported `src/client/room-presenter.ts`).
 * `buildRoomPanels` is the only thing standing between the `teamRoom`
 * projection cell and the settings page rows, so its guard, ordering, live
 * overlay, and timeline bound are all pinned here.
 * @module dsh-team-rooms/tests/room-presenter.spec
 */

import { describe, expect, it } from 'vitest'
import {
  buildRoomPanels, currentSessionIdOf, emptyTeamRoomsState, type SessionListLike,
} from '../src/client/room-presenter.ts'
import type { TeamRoomView } from '../src/room/schema.ts'

/** A valid `teamRoom` projection cell with two members and three tasks. */
function view(over: Partial<TeamRoomView> = {}): TeamRoomView {
  return {
    rooms: [{
      roomId: 'room-1',
      name: 'ops room',
      createdAt: 1_000,
      members: [
        { sessionId: 's-2', role: 'member', joinedAt: 200 },
        { sessionId: 's-1', role: 'owner', joinedAt: 100 },
      ],
      tasks: [
        {
          taskId: 't-done', title: 'shipped', description: '', status: 'done',
          assigneeSessionId: 's-1', createdBy: 's-1', createdAt: 30, updatedAt: 50,
        },
        {
          taskId: 't-todo', title: 'open work', description: 'details', status: 'todo',
          assigneeSessionId: null, createdBy: 's-1', createdAt: 10, updatedAt: 10,
        },
        {
          taskId: 't-progress', title: 'in flight', description: '', status: 'in-progress',
          assigneeSessionId: 's-2', createdBy: 's-1', createdAt: 20, updatedAt: 25,
        },
      ],
      timeline: [
        { roomId: 'room-1', seq: 1, kind: 'member-joined', at: 20, data: { sessionId: 's-2' } },
        { roomId: 'room-1', seq: 3, kind: 'message-posted', at: 30, data: { text: 'later' } },
        { roomId: 'room-1', seq: 2, kind: 'task-created', at: 25, data: { title: 'open work' } },
      ],
    }],
    ...over,
  }
}

/** A session list carrying a live title for exactly one member. */
function list(over: SessionListLike = { byId: {} }): SessionListLike {
  return over
}

describe('buildRoomPanels — the opaque-cell guard', () => {
  it('returns undefined for a missing or malformed projection cell', () => {
    for (const value of [undefined, null, {}, { rooms: 'nope' }, { rooms: [{ roomId: '' }] }, 42, 'x']) {
      expect(buildRoomPanels(value, list())).toBeUndefined()
    }
  })

  it('returns an empty panel list for an empty but valid view', () => {
    expect(buildRoomPanels({ rooms: [] }, list())).toEqual([])
  })

  it('never leaks the projection\'s own member shape into the rendered rows', () => {
    const panels = buildRoomPanels(view(), list())!
    // The presenter strips `lastDeliveredSeq`-style fields by construction:
    // every row is exactly the documented row shape.
    expect(Object.keys(panels[0]!.members[0]!).sort()).toEqual(['joinedAt', 'live', 'role', 'sessionId'])
    expect(Object.keys(panels[0]!.tasks[0]!).sort()).toEqual([
      'assigneeSessionId', 'createdBy', 'description', 'status', 'taskId', 'title',
    ])
    expect(Object.keys(panels[0]!.timeline[0]!).sort()).toEqual(['data', 'kind', 'seq'])
  })
})

describe('buildRoomPanels — members, live overlay, and ordering', () => {
  it('orders members by joinedAt and marks only the sessions present in the session list as live', () => {
    const panels = buildRoomPanels(view(), list({
      byId: { 's-2': { id: 's-2', running: true, displayTitle: 'writer session' } },
    }))!
    expect(panels[0]!.members.map(member => member.sessionId)).toEqual(['s-1', 's-2'])
    expect(panels[0]!.members[0]).toEqual({ sessionId: 's-1', role: 'owner', joinedAt: 100, live: false })
    expect(panels[0]!.members[1]).toEqual({
      sessionId: 's-2', role: 'member', joinedAt: 200, live: true, title: 'writer session',
    })
  })

  it('omits the title key entirely when the session list carries no display title', () => {
    const panels = buildRoomPanels(view(), list({ byId: { 's-1': { id: 's-1' } } }))!
    expect('title' in panels[0]!.members[0]!).toBe(false)
    expect(panels[0]!.members[0]!.live).toBe(true)
  })
})

describe('buildRoomPanels — task ordering', () => {
  it('sorts todo before in-progress before done, then by task id inside one status', () => {
    const panels = buildRoomPanels(view({
      rooms: [{
        ...view().rooms[0]!,
        tasks: [
          { taskId: 'b', title: 'b', description: '', status: 'todo', assigneeSessionId: null, createdBy: 's', createdAt: 1, updatedAt: 1 },
          { taskId: 'a', title: 'a', description: '', status: 'todo', assigneeSessionId: null, createdBy: 's', createdAt: 1, updatedAt: 1 },
          { taskId: 'z', title: 'z', description: '', status: 'done', assigneeSessionId: null, createdBy: 's', createdAt: 1, updatedAt: 1 },
          { taskId: 'm', title: 'm', description: '', status: 'in-progress', assigneeSessionId: null, createdBy: 's', createdAt: 1, updatedAt: 1 },
        ],
      }],
    }), list())!
    expect(panels[0]!.tasks.map(task => task.taskId)).toEqual(['a', 'b', 'm', 'z'])
  })
})

describe('buildRoomPanels — the timeline window', () => {
  it('serves the 100 newest entries, newest first', () => {
    const timeline = Array.from({ length: 130 }, (_, index) => ({
      roomId: 'room-1',
      seq: index,
      kind: 'message-posted' as const,
      at: index,
      data: { text: `line ${index}` },
    }))
    const panels = buildRoomPanels(view({
      rooms: [{ ...view().rooms[0]!, timeline }],
    }), list())!
    expect(panels[0]!.timeline).toHaveLength(100)
    expect(panels[0]!.timeline[0]!.seq).toBe(129)
    expect(panels[0]!.timeline.at(-1)!.seq).toBe(30)
  })

  it('passes the raw timeline seq and kind through unchanged for the label renderer', () => {
    const panels = buildRoomPanels(view(), list())!
    expect(panels[0]!.timeline.map(entry => entry.seq)).toEqual([3, 2, 1])
    expect(panels[0]!.timeline[0]).toEqual({
      seq: 3, kind: 'message-posted', data: { text: 'later' },
    })
  })
})

describe('emptyTeamRoomsState', () => {
  it('is a ready state with no session and no rooms', () => {
    expect(emptyTeamRoomsState()).toEqual({ status: 'ready', rooms: [] })
  })
})

describe('currentSessionIdOf — the B5 main-view retention derivation', () => {
  it('returns undefined for an empty list', () => {
    expect(currentSessionIdOf({ byId: {} })).toBeUndefined()
  })

  it('returns undefined when no row is retained by the main view', () => {
    // The removed `SessionListState.current` used to carry this; without a
    // retention count there is no open conversation to bind the panel to.
    expect(currentSessionIdOf({ byId: { 's-1': { id: 's-1', running: true } } })).toBeUndefined()
  })

  it('returns the row the main view retains', () => {
    const list: SessionListLike = {
      byId: {
        's-1': { id: 's-1', retainedBy: { mainView: 0 } },
        's-2': { id: 's-2', retainedBy: { mainView: 1 } },
        's-3': { id: 's-3', retainedBy: { mainView: 2 } },
      },
    }
    expect(currentSessionIdOf(list)).toBe('s-2')
  })

  it('ignores a negative or missing retention count', () => {
    const list: SessionListLike = {
      byId: {
        's-1': { id: 's-1', retainedBy: { mainView: -1 } },
        's-2': { id: 's-2' },
        's-3': { id: 's-3', retainedBy: { mainView: 1 } },
      },
    }
    expect(currentSessionIdOf(list)).toBe('s-3')
  })
})
