// scripts/loader-runner.mjs — real Loader composition runner (community
// five-layer model, layer 4). An independent process boots a real Context,
// mounts the vendored Loader with the Include builtin, reads the given
// cordis.yml (the plugin row + config), then asserts the plugin's
// contribution through the tool registry. Config is applied by the Loader,
// so a valid mount proves module unwrap + inject resolution + config schema.
//
// The three inject services (`tools`, `agents`, `sessions`) plus a minimal
// `storageDomain` are provided in-process as narrow fakes: the plugin
// registers its eight room_* tools through `tools` once the storage domain is
// composed (an in-memory Map per table is enough — only registration is
// observed here), and reads the agent / session registries only for room
// delivery. The real services in this repository resolve through the local
// harness checkout in vitest (not through this plain-Node runner), so the
// faithful-load test composes the plugin's own built bundle instead.
//
// There is deliberately no `subagents` fake: team rooms never spawn a child
// agent, so the plugin does not inject that service at all — the absence is
// itself part of what this runner proves.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml> [bare]
// Exit 0 prints DSH_LOADER_RESULT <json>; a load failure (invalid config,
// default export) exits non-zero with the reason on stderr. The optional
// `bare` mode skips the in-process service provides so a default-export
// wrapper's apply fails with the missing-inject reason instead of mounting.

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
const bare = process.argv[3] === 'bare'
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml> [bare]')
  process.exit(2)
}

const configPath = resolve(configArgument)
// Resolve bare package rows from this repository's dependency tree so the
// composition works with config files written anywhere (e.g. a temp dir).
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  const registered = []
  if (!bare) {
    ctx.provide('tools', {
      register(definition) {
        registered.push(definition)
        return () => undefined
      },
      schemas() {
        return registered.map(definition => ({ name: definition.name, parameters: definition.parameters, description: definition.description }))
      },
      get(name) {
        return registered.find(definition => definition.name === name)
      },
    })
    ctx.provide('agents', { get: () => undefined })
    ctx.provide('sessions', { get: () => undefined })
    // A minimal in-memory storage domain: `open()` must answer with the four
    // declared tables so the room hub resolves and the room_* tools register.
    const tables = new Map()
    const kv = name => {
      if (!tables.has(name)) tables.set(name, new Map())
      const store = tables.get(name)
      return {
        get: key => store.get(key),
        put: async (key, value) => { store.set(key, value) },
        update: async (key, fn) => { const next = fn(store.get(key)); store.set(key, next); return next },
        delete: async key => { store.delete(key) },
        entries: () => store.entries(),
      }
    }
    ctx.provide('storageDomain', {
      open: async () => ({ close: async () => {}, table: kv }),
    })
  }
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()

  // The authoritative tool registry carries the plugin's contribution.
  const names = registered.map(definition => definition.name)
  for (const expected of [
    'room_list_rooms', 'room_post', 'room_read', 'room_list_tasks',
    'room_create_task', 'room_claim_task', 'room_transfer_task', 'room_complete_task',
  ]) {
    if (!names.includes(expected)) {
      throw new Error(`Loader composition: ${expected} tool is missing (registered: ${names.join(', ')})`)
    }
  }
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify({ tools: names.sort() })}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}
