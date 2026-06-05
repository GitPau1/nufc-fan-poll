import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const source = fs.readFileSync(path.join(__dirname, 'transfers.ts'), 'utf8')

test('latest transfers applies the requested limit in the database query', () => {
  assert.match(source, /getTransfersBySeasonId\(seasonId: string, limit\?: number\)/)
  assert.match(source, /\.limit\(limit\)/)
  assert.match(source, /getTransfersBySeasonId\(seasonId, limit\)/)
})
