/**
 * The `team_rooms` storage-domain declaration: rooms, the message bus, the
 * task board, and the shared timeline as four KV tables over the harness's
 * own storage layer (SQLite or JSONL backend — the deployment chooses; the
 * plugin adds no service of its own). Records are validated at the durable
 * boundary by the same zod schemas the projection and the client share.
 *
 * The domain's single write chain is the ordering authority: every bus
 * append and cursor bump queues on it, so concurrent posters can never
 * interleave a read-modify-write.
 *
 * @module dsh-team-rooms/room/domain
 */
/** Branded-ish key aliases: append-table keys are plain `${roomId}/${…}` strings. */
export type RoomKey = string & {
    readonly __roomKey?: never;
};
export type AppendKey = string & {
    readonly __appendKey?: never;
};
/**
 * The domain spec: identity, format version, and the four declared tables.
 * The same schemas validate every record at the durable read boundary.
 */
export declare const teamRoomsDomainSpec: {
    name: string;
    version: number;
    tables: {
        rooms: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<RoomKey, {
            name: string;
            roomId: string;
            createdAt: number;
            members: {
                sessionId: string;
                role: "owner" | "member";
                joinedAt: number;
                lastDeliveredSeq: number;
                lastFactSeq: number;
            }[];
            busNext: number;
            timelineNext: number;
        }>;
        bus: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            text: string;
            roomId: string;
            createdAt: number;
            seq: number;
            senderSessionId: string;
            toSessionId?: string | undefined;
        }>;
        tasks: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            status: "todo" | "in-progress" | "done";
            title: string;
            roomId: string;
            createdAt: number;
            taskId: string;
            description: string;
            assigneeSessionId: string | null;
            createdBy: string;
            updatedAt: number;
            completedAt?: number | undefined;
        }>;
        timeline: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<AppendKey, {
            at: number;
            data: Record<string, unknown>;
            roomId: string;
            seq: number;
            kind: "room-created" | "member-joined" | "member-left" | "message-posted" | "message-directed" | "task-created" | "task-claimed" | "task-assigned" | "task-completed";
        }>;
    };
};
//# sourceMappingURL=domain.d.ts.map