import { defineConfig } from 'vitest/config'
import { aliases } from './vitest.aliases.mjs'

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    pool: 'forks',
    // Serialize test files: composition.spec.ts rebuilds lib/ in its
    // beforeAll (scripts/clean.mjs removes lib/index.js and lib/client.js
    // first), and completeness.spec.ts asserts over those same packaged
    // faces. In parallel they race — the Coverage step died on ENOENT
    // whenever completeness ran inside the clean→rebuild window.
    fileParallelism: false,
  },
})
