import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('players page maps Supabase base_rating to overall and ranking', () => {
  const file = source('app/players/page.tsx')

  assert.match(file, /base_rating/)
  assert.match(file, /overall: player\.base_rating/)
  assert.match(file, /rank: index \+ 1/)
  assert.match(file, /\.order\('base_rating', \{ ascending: false/)
  assert.doesNotMatch(file, /Math\.max\(70, 96 - index\)/)
})
