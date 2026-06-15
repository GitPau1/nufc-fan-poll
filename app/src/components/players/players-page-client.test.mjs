import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('players page keeps the Figma Pick One section above search', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /Pick One/)
  assert.match(file, /여러분의 선택이 오버롤에 반영됩니다/)
  assert.match(file, /PickOneSection/)
})

test('players page keeps original rank while filtering', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /rank: number/)
  assert.match(file, /<PlayerRow key=\{player\.id\} player=\{player\} \/>/)
  assert.match(file, /\{player\.rank\}/)
  assert.doesNotMatch(file, /rank=\{index \+ 1\}/)
})
