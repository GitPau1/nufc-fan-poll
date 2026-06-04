import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'result-ranking.ts')

function loadResultRankingModule() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: true,
    },
  }).outputText

  const cjsModule = { exports: {} }
  const fn = new Function('exports', 'module', compiled)
  fn(cjsModule.exports, cjsModule)
  return cjsModule.exports
}

test('sorts result items by count and keeps original option order for ties', () => {
  const { buildPollResultItems } = loadResultRankingModule()

  const options = [
    { id: 'first', label: 'First option' },
    { id: 'second', label: 'Second option' },
    { id: 'third', label: 'Third option' },
    { id: 'fourth', label: 'Fourth option' },
  ]

  const result = buildPollResultItems(options, {
    first: 10,
    second: 20,
    third: 20,
    fourth: 0,
  }, null, {})

  assert.deepEqual(
    result.map(item => item.option.id),
    ['second', 'third', 'first', 'fourth']
  )
  assert.deepEqual(
    result.map(item => item.percent),
    [40, 40, 20, 0]
  )
})

test('marks my option and derives optional image urls', () => {
  const { buildPollResultItems } = loadResultRankingModule()

  const options = [
    {
      id: 'with-option-image',
      label: 'Option image',
      image_url: 'https://example.com/option.jpg',
      player_id: 'player-1',
    },
    {
      id: 'with-player-image',
      label: 'Player image',
      image_url: null,
      player_id: 'player-2',
    },
    {
      id: 'without-image',
      label: 'No image',
      image_url: null,
      player_id: 'player-3',
    },
  ]

  const result = buildPollResultItems(options, {
    'with-option-image': 1,
    'with-player-image': 1,
    'without-image': 1,
  }, 'with-player-image', {
    'player-1': { photo_url: 'https://example.com/player-1.jpg' },
    'player-2': { photo_url: 'https://example.com/player-2.jpg' },
    'player-3': { photo_url: null },
  })

  assert.equal(result[0].imageUrl, 'https://example.com/option.jpg')
  assert.equal(result[1].imageUrl, 'https://example.com/player-2.jpg')
  assert.equal(result[1].isMine, true)
  assert.equal(result[2].imageUrl, null)
})
