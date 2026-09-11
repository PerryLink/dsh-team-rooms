/**
 * The `teamRoom` projection fold — the coverage hole the source plugin never
 * closed. `src/room/projection.ts` is the only place member session logs are
 * turned back into the room view the settings page renders, so a regression
 * here silently empties the panel while every room tool still reports success.
 *
 * This suite drives the real `teamRoomProjectionDefinition` through the same
 * `SessionEvent` shape the harness folds (`{ type, seq, time, data }`), and
 * asserts the two hard bounds (`TIMELINE_FOLD_BOUND`, `DONE_TASK_FOLD_BOUND`)
 * that the wire `view()` applies.
 * @module dsh-team-rooms/tests/room-projection.spec
 */

import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { teamRoomProjectionDefinition as unit } from '../src/room/projection.ts'
import { TEAM_ROOM_FACT } from '../src/room/events.ts'
import type { TeamRoomFact } from '../src/room/events.ts'

/** The fold state type, read off the unit (the module keeps it private). */
type State = ReturnType<typeof unit.init>

let seq = 0

/** One `team-room/fact` session event, exactly as the appender writes it. */
function fact(data: TeamRoomFact, time?: number): SessionEvent {
  seq += 1
  return { type: TEAM_ROOM_FACT, seq, time: time ?? seq, data } as unknown as SessionEvent
}

/** One non-room event: the fold must ignore it byte-for-byte. */
function foreignEvent(): SessionEvent {
  seq += 1
  return { type: 'user/message', seq, time: seq, data: {} } as unknown as SessionEvent
}

function fold(events: SessionEvent[]): State {
  return events.reduce((state, next) => unit.apply(state, next), unit.init())
}

/** The wire value (what the client actually receives). */
function view(events: SessionEvent[]) {
  return unit.wire.view(fold(events))
}

/** One `room-joined` fact carrying a full snapshot (the cold-log case). */
function joined(over: Partial<Extract<TeamRoomFact, { kind: 'room-joined' }>> = {}): SessionEvent {
  return fact({
    kind: 'room-joined',
    roomId: 'room-1',
    name: 'ops room',
    createdAt: 1_000,
    // The fact carries the store's RoomMember rows verbatim, cursors included.
    members: [{ sessionId: 's-1', role: 'owner', joinedAt: 1_000, lastDeliveredSeq: 0, lastFactSeq: -1 }],
    tasks: [],
    timeline: [],
    ...over,
  })
}

describe('teamRoom projection — registration and identity', () => {
  it('registers under the D3 keystone key `teamRoom` at stateVersion 1', () => {
    expect(unit.key).toBe('teamRoom')
    expect(unit.stateVersion).toBe(1)
  })

  it('folds a room-joined snapshot into one room view with its member list', () => {
    const result = view([joined()])
    expect(result.rooms).toHaveLength(1)
    expect(result.rooms[0]).toMatchObject({
      roomId: 'room-1',
      name: 'ops room',
      createdAt: 1_000,
      members: [{ sessionId: 's-1', role: 'owner', joinedAt: 1_000 }],
      tasks: [],
      timeline: [],
    })
  })

  it('is a pure fold: a non-room event returns the identical state object', () => {
    const before = fold([joined()])
    expect(unit.apply(before, foreignEvent())).toBe(before)
  })

  it('never folds a fact for an unknown room, and never duplicates on replay', () => {
    const orphan = fold([fact({
      kind: 'member-joined',
      roomId: 'ghost',
      sessionId: 's-2',
      role: 'member',
      joinedAt: 5,
      timelineSeq: 0,
    })])
    expect(orphan.rooms).toEqual([])

    const replayed = fold([joined(), joined()])
    expect(replayed.rooms).toHaveLength(1)
  })

  it('starts empty and stays empty for a log with no room facts', () => {
    expect(unit.wire.view(unit.init())).toEqual({ rooms: [] })
    expect(fold([foreignEvent(), foreignEvent()]).rooms).toEqual([])
  })
})

describe('teamRoom projection — membership and the shared timeline', () => {
  it('appends a member-joined row and one ordered timeline entry', () => {
    const state = view([
      joined(),
      fact({ kind: 'member-joined', roomId: 'room-1', sessionId: 's-2', role: 'member', joinedAt: 40, timelineSeq: 1 }, 40),
    ])
    expect(state.rooms[0]!.members.map(member => member.sessionId)).toEqual(['s-1', 's-2'])
    expect(state.rooms[0]!.timeline).toEqual([
      { roomId: 'room-1', seq: 1, kind: 'member-joined', at: 40, data: { sessionId: 's-2', role: 'member' } },
    ])
  })

  it('does not duplicate a member that is already in the roster', () => {
    const state = view([
      joined(),
      fact({ kind: 'member-joined', roomId: 'room-1', sessionId: 's-1', role: 'owner', joinedAt: 1_000, timelineSeq: 1 }, 1_000),
    ])
    expect(state.rooms[0]!.members).toHaveLength(1)
    // The fold is idempotent for a replayed roster row: the early return
    // leaves the whole room untouched, timeline included.
    expect(state.rooms[0]!.timeline).toEqual([])
  })

  it('removes a member on member-left and records the departure', () => {
    const state = view([
      joined(),
      fact({ kind: 'member-left', roomId: 'room-1', sessionId: 's-1', timelineSeq: 1 }, 90),
    ])
    expect(state.rooms[0]!.members).toEqual([])
    expect(state.rooms[0]!.timeline[0]).toMatchObject({ seq: 1, kind: 'member-left', data: { sessionId: 's-1' } })
  })

  it('classifies a bus message as broadcast or directed and keeps the payload verbatim', () => {
    const state = view([
      joined(),
      fact({
        kind: 'message-posted', roomId: 'room-1', seq: 0, timelineSeq: 1,
        senderSessionId: 's-1', text: 'hello team', createdAt: 10,
      }, 10),
      fact({
        kind: 'message-posted', roomId: 'room-1', seq: 1, timelineSeq: 2,
        senderSessionId: 's-1', toSessionId: 's-2', text: 'for you', createdAt: 11,
      }, 11),
    ])
    expect(state.rooms[0]!.timeline.map(entry => entry.kind)).toEqual(['message-posted', 'message-directed'])
    expect(state.rooms[0]!.timeline[1]!.data).toEqual({
      seq: 1, senderSessionId: 's-1', toSessionId: 's-2', text: 'for you',
    })
  })

  it('dedupes a replayed timeline seq and orders entries by seq, not arrival order', () => {
    const state = view([
      joined(),
      fact({ kind: 'member-left', roomId: 'room-1', sessionId: 's-1', timelineSeq: 5 }, 50),
      fact({ kind: 'member-joined', roomId: 'room-1', sessionId: 's-2', role: 'member', joinedAt: 20, timelineSeq: 2 }, 20),
      fact({ kind: 'member-left', roomId: 'room-1', sessionId: 's-1', timelineSeq: 5 }, 50),
    ])
    expect(state.rooms[0]!.timeline.map(entry => entry.seq)).toEqual([2, 5])
  })
})

describe('teamRoom projection — the task board', () => {
  it('creates a todo row from a task-created fact and moves it through claim and complete', () => {
    const milestone = view([
      joined(),
      fact({
        kind: 'task-created', roomId: 'room-1', taskId: 't-1', title: 'write the report',
        description: 'full draft', assigneeSessionId: null, createdBy: 's-1', createdAt: 30, timelineSeq: 1,
      }, 30),
      fact({ kind: 'task-claimed', roomId: 'room-1', taskId: 't-1', assigneeSessionId: 's-1', at: 40, timelineSeq: 2 }, 40),
      fact({ kind: 'task-completed', roomId: 'room-1', taskId: 't-1', at: 50, timelineSeq: 3 }, 50),
    ])
    expect(milestone.rooms[0]!.tasks).toEqual([{
      roomId: 'room-1',
      taskId: 't-1',
      title: 'write the report',
      description: 'full draft',
      status: 'done',
      assigneeSessionId: 's-1',
      createdBy: 's-1',
      createdAt: 30,
      updatedAt: 50,
    }])
    expect(milestone.rooms[0]!.timeline.map(entry => entry.kind))
      .toEqual(['task-created', 'task-claimed', 'task-completed'])
  })

  it('moves an unassigned row to in-progress on task-assigned and records the handoff actor', () => {
    const state = view([
      joined(),
      fact({
        kind: 'task-created', roomId: 'room-1', taskId: 't-1', title: 'handoff',
        description: '', assigneeSessionId: null, createdBy: 's-1', createdAt: 30, timelineSeq: 1,
      }, 30),
      fact({
        kind: 'task-assigned', roomId: 'room-1', taskId: 't-1',
        assigneeSessionId: 's-2', bySessionId: 's-1', at: 60, timelineSeq: 2,
      }, 60),
    ])
    expect(state.rooms[0]!.tasks[0]).toMatchObject({
      status: 'in-progress', assigneeSessionId: 's-2', updatedAt: 60,
    })
    expect(state.rooms[0]!.timeline[1]!.data).toEqual({
      taskId: 't-1', assigneeSessionId: 's-2', bySessionId: 's-1',
    })
  })

  it('ignores a task delta for a row that is not on the board', () => {
    const state = view([
      joined(),
      fact({ kind: 'task-claimed', roomId: 'room-1', taskId: 'missing', assigneeSessionId: 's-1', at: 40, timelineSeq: 1 }, 40),
    ])
    expect(state.rooms[0]!.tasks).toEqual([])
    // The timeline still records the fact: the fold never hides an event.
    expect(state.rooms[0]!.timeline).toHaveLength(1)
  })

  it('ignores a duplicate task-created for the same task id', () => {
    const created = fact({
      kind: 'task-created', roomId: 'room-1', taskId: 't-1', title: 'once',
      description: '', assigneeSessionId: null, createdBy: 's-1', createdAt: 30, timelineSeq: 1,
    } as TeamRoomFact, 30)
    const state = fold([joined(), created, created])
    expect(state.rooms[0]!.tasks).toHaveLength(1)
  })
})

describe('teamRoom projection — the hard fold bounds', () => {
  it('keeps at most 1000 timeline entries per room, newest by seq', () => {
    const events: SessionEvent[] = [joined()]
    for (let index = 0; index < 1_010; index++) {
      events.push(fact({
        kind: 'message-posted', roomId: 'room-1', seq: index, timelineSeq: index,
        senderSessionId: 's-1', text: `line ${index}`, createdAt: index,
      }, index))
    }
    const timeline = view(events).rooms[0]!.timeline
    expect(timeline).toHaveLength(1_000)
    expect(timeline[0]!.seq).toBe(10)
    expect(timeline.at(-1)!.seq).toBe(1_009)
  })

  it('caps the done-task backlog at 100 newest rows in the wire value while keeping open rows', () => {
    const events: SessionEvent[] = [joined()]
    for (let index = 0; index < 105; index++) {
      events.push(fact({
        kind: 'task-created', roomId: 'room-1', taskId: `done-${index}`, title: `done ${index}`,
        description: '', assigneeSessionId: null, createdBy: 's-1', createdAt: index, timelineSeq: index,
      }, index))
      events.push(fact({
        kind: 'task-completed', roomId: 'room-1', taskId: `done-${index}`, at: index, timelineSeq: index,
      }, index))
    }
    // One row that stays open: the cap must never drop it.
    events.push(fact({
      kind: 'task-created', roomId: 'room-1', taskId: 'open-1', title: 'still open',
      description: '', assigneeSessionId: null, createdBy: 's-1', createdAt: 999, timelineSeq: 999,
    }, 999))

    const state = fold(events)
    // The fold state keeps every row (the persisted cache is complete) …
    expect(state.rooms[0]!.tasks).toHaveLength(106)

    // … while the wire value the client receives caps the done backlog.
    const wire = unit.wire.view(state).rooms[0]!.tasks
    expect(wire.filter(task => task.status === 'done')).toHaveLength(100)
    expect(wire.filter(task => task.status !== 'done').map(task => task.taskId)).toEqual(['open-1'])
    // Newest-first: the five oldest done rows are the ones dropped.
    const keptDone = wire.filter(task => task.status === 'done').map(task => task.taskId)
    expect(keptDone).not.toContain('done-0')
    expect(keptDone).toContain('done-104')
  })

  it('drops the earliest room-joined snapshot timeline beyond the bound too', () => {
    const seeded = Array.from({ length: 1_050 }, (_, index) => ({
      roomId: 'room-1',
      seq: index,
      kind: 'message-posted' as const,
      at: index,
      data: { text: `seeded ${index}` },
    }))
    const result = view([joined({ timeline: seeded })])
    expect(result.rooms[0]!.timeline).toHaveLength(1_000)
    expect(result.rooms[0]!.timeline[0]!.seq).toBe(50)
  })
})
