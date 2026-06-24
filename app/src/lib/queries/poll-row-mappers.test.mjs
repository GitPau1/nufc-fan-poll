import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'poll-row-mappers.ts')

async function loadModule() {
  return import(`${sourcePath}?cacheBust=${Date.now()}`)
}

test('maps poll list rows with creator names, normalized players, and vote counts', async () => {
  const { mapPollListRow } = await loadModule()
  const now = new Date('2026-06-25T00:00:00.000Z')
  const row = {
    id: 'poll-1',
    type: 'subject_options',
    title: 'Keep him?',
    description: null,
    status: 'active',
    thumbnail_url: null,
    closes_at: '2026-06-26T00:00:00.000Z',
    scheduled_at: null,
    created_at: '2026-06-24T00:00:00.000Z',
    player_id: 'player-1',
    created_by: 'user-1',
    player: { id: 'player-1', name: 'Bruno', squad_status: null },
    poll_options: [{ id: 'option-1' }],
    vote_count: [{ count: 7 }],
  }

  assert.deepEqual(mapPollListRow(row, {
    now,
    creatorNames: new Map([['user-1', 'Paul']]),
    ratingParticipantCounts: new Map(),
    resolveStatus: input => input.status,
  }), {
    id: 'poll-1',
    type: 'subject_options',
    title: 'Keep him?',
    description: null,
    status: 'active',
    thumbnail_url: null,
    closes_at: '2026-06-26T00:00:00.000Z',
    scheduled_at: null,
    created_at: '2026-06-24T00:00:00.000Z',
    player_id: 'player-1',
    created_by: 'user-1',
    creator_name: 'Paul',
    player: { id: 'player-1', name: 'Bruno', squad_status: 'first_team' },
    poll_options: [{ id: 'option-1' }],
    vote_count: 7,
  })
})

test('uses rating participant counts for overall rating poll list rows', async () => {
  const { mapPollListRow } = await loadModule()
  const row = {
    id: 'poll-2',
    type: 'overall_rating',
    title: 'Rate everyone',
    description: 'After full time',
    status: 'closed',
    thumbnail_url: 'https://cdn.example.com/thumb.webp',
    closes_at: '2026-06-24T00:00:00.000Z',
    scheduled_at: '2026-06-23T00:00:00.000Z',
    created_at: '2026-06-22T00:00:00.000Z',
    player_id: null,
    created_by: null,
    player: null,
    poll_options: [],
    vote_count: [{ count: 99 }],
  }

  const mapped = mapPollListRow(row, {
    now: new Date('2026-06-25T00:00:00.000Z'),
    creatorNames: new Map(),
    ratingParticipantCounts: new Map([['poll-2', 3]]),
    resolveStatus: () => 'closed',
  })

  assert.equal(mapped.vote_count, 3)
  assert.equal(mapped.creator_name, null)
  assert.equal(mapped.player, null)
})

test('maps poll detail rows with sorted options and option players', async () => {
  const { mapPollDetailRow } = await loadModule()
  const row = {
    id: 'poll-3',
    type: 'overall_rating',
    title: 'Rate the squad',
    description: null,
    status: 'active',
    thumbnail_url: null,
    created_at: '2026-06-24T00:00:00.000Z',
    scheduled_at: null,
    closes_at: '2026-06-26T00:00:00.000Z',
    player_id: null,
    created_by: 'user-2',
    player: null,
    poll_options: [
      {
        id: 'option-2',
        player_id: 'player-2',
        display_order: 2,
        option_player: { id: 'player-2', name: 'Isak', squad_status: null },
      },
      {
        id: 'option-1',
        player_id: 'player-1',
        display_order: 1,
        option_player: { id: 'player-1', name: 'Bruno', squad_status: 'first_team' },
      },
    ],
  }

  assert.deepEqual(mapPollDetailRow(row, {
    creatorNames: new Map([['user-2', 'Admin']]),
    currentSeasonStats: {
      'player-1': { appearances: 30, goals: 5, assists: 7 },
    },
    resolveStatus: input => input.status,
  }), {
    id: 'poll-3',
    type: 'overall_rating',
    title: 'Rate the squad',
    description: null,
    status: 'active',
    thumbnail_url: null,
    created_at: '2026-06-24T00:00:00.000Z',
    scheduled_at: null,
    closes_at: '2026-06-26T00:00:00.000Z',
    player_id: null,
    created_by: 'user-2',
    creator_name: 'Admin',
    player: null,
    poll_options: [
      {
        id: 'option-1',
        player_id: 'player-1',
        display_order: 1,
        option_player: { id: 'player-1', name: 'Bruno', squad_status: 'first_team' },
      },
      {
        id: 'option-2',
        player_id: 'player-2',
        display_order: 2,
        option_player: { id: 'player-2', name: 'Isak', squad_status: null },
      },
    ],
    option_players: {
      'player-1': { id: 'player-1', name: 'Bruno', squad_status: 'first_team' },
      'player-2': { id: 'player-2', name: 'Isak', squad_status: 'first_team' },
    },
    current_season_stats: {
      'player-1': { appearances: 30, goals: 5, assists: 7 },
    },
  })
})

test('omits empty optional poll detail maps', async () => {
  const { mapPollDetailRow } = await loadModule()
  const mapped = mapPollDetailRow({
    id: 'poll-4',
    type: 'free_choice',
    title: 'Best kit',
    description: 'Pick one',
    status: 'closed',
    thumbnail_url: 'https://cdn.example.com/poll.webp',
    created_at: null,
    scheduled_at: null,
    closes_at: '2026-06-24T00:00:00.000Z',
    player_id: null,
    created_by: null,
    player: null,
    poll_options: [],
  }, {
    creatorNames: new Map(),
    currentSeasonStats: {},
    resolveStatus: () => 'closed',
  })

  assert.equal('option_players' in mapped, false)
  assert.equal('current_season_stats' in mapped, false)
  assert.equal(mapped.creator_name, null)
})
