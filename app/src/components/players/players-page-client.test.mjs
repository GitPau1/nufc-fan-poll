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

  assert.match(file, /여러분의 선택은\?/)
  assert.match(file, /여러분의 선택이 이번주 오버롤에 반영됩니다\./)
  assert.match(file, /PickOneSection/)
})

test('players Pick One uses the approved card transition states', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /phase.*'idle'.*'confirming'.*'centered'/s)
  assert.match(file, /setTimeout[\s\S]*1000/)
  assert.match(file, /window\.setTimeout[\s\S]*120/)
  assert.match(file, /enter-right/)
  assert.match(file, /requestAnimationFrame\(\(\) => \{\s*window\.setTimeout/s)
  assert.match(file, /한 번 더 누르면 다음 선택으로 넘어갑니다\./)
  assert.match(file, /shadow-\[inset_0_0_0_3px_#32c2ff\]/)
  assert.doesNotMatch(file, /Target/)
  assert.doesNotMatch(file, /PickOneResult/)
})

test('players page keeps original rank while filtering', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /rank: number/)
  assert.match(file, /<PlayerRow key=\{player\.id\} player=\{player\} \/>/)
  assert.match(file, /\{player\.rank\}/)
  assert.doesNotMatch(file, /rank=\{index \+ 1\}/)
})

test('players list shows seasons instead of squad status metadata', () => {
  const file = source('components/players/PlayersPageClient.tsx')
  const playerRow = file.slice(file.indexOf('function PlayerRow'))

  assert.match(playerRow, /\{player\.seasons\}/)
  assert.doesNotMatch(playerRow, /\{player\.meta\}/)
})
