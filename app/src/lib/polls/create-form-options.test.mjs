import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'create-form-options.ts')

async function loadModule() {
  return import(`${sourcePath}?cacheBust=${Date.now()}`)
}

const players = [
  { id: 'p1', name: 'Bruno Guimaraes' },
  { id: 'p2', name: 'Alexander Isak' },
  { id: 'p3', name: 'Sandro Tonali' },
]

test('builds subject option payload for a selected player', async () => {
  const { buildCreatePollOptions } = await loadModule()

  assert.deepEqual(buildCreatePollOptions({
    pollType: 'subject_options',
    textOptions: ['Stay', 'Sell', ' '],
    freeOptions: [],
    selectedSubjectPlayerId: 'p1',
    selectedPlayerIds: [],
    players,
  }), {
    ok: true,
    playerId: 'p1',
    options: [{ label: 'Stay' }, { label: 'Sell' }],
  })
})

test('requires at least two subject options', async () => {
  const { buildCreatePollOptions } = await loadModule()

  assert.deepEqual(buildCreatePollOptions({
    pollType: 'subject_options',
    textOptions: ['Stay', ' '],
    freeOptions: [],
    selectedSubjectPlayerId: 'p1',
    selectedPlayerIds: [],
    players,
  }), {
    ok: false,
    message: '선택지를 최소 2개 입력해주세요.',
  })
})

test('builds free choice options with upload field names', async () => {
  const { buildCreatePollOptions } = await loadModule()

  assert.deepEqual(buildCreatePollOptions({
    pollType: 'free_choice',
    textOptions: [],
    freeOptions: [
      { label: 'Home kit', description: 'Blue trim', imageUrl: '' },
      { label: 'Away kit', description: '', imageUrl: 'https://example.com/away.webp' },
      { label: ' ', description: 'ignored', imageUrl: '' },
    ],
    selectedSubjectPlayerId: null,
    selectedPlayerIds: [],
    players,
  }), {
    ok: true,
    playerId: null,
    options: [
      { label: 'Home kit', description: 'Blue trim', image_url: null, imageField: 'free_option_image_0' },
      { label: 'Away kit', description: null, image_url: 'https://example.com/away.webp', imageField: 'free_option_image_1' },
    ],
  })
})

test('builds player target options from selected player ids', async () => {
  const { buildCreatePollOptions } = await loadModule()

  assert.deepEqual(buildCreatePollOptions({
    pollType: 'overall_rating',
    textOptions: [],
    freeOptions: [],
    selectedSubjectPlayerId: null,
    selectedPlayerIds: ['p2', 'missing', 'p3'],
    players,
  }), {
    ok: true,
    playerId: null,
    options: [
      { label: 'Alexander Isak', player_id: 'p2' },
      { label: 'missing', player_id: 'missing' },
      { label: 'Sandro Tonali', player_id: 'p3' },
    ],
  })
})
