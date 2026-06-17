import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const repoRoot = path.resolve(root, '..', '..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function repoSource(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('players page reads applied pick one ratings before falling back to base rating', () => {
  const file = source('app/players/page.tsx')

  assert.match(file, /player_pick_one_ratings/)
  assert.match(file, /overall: Math\.round\(player\.pick_one_rating \?\? player\.base_rating\)/)
})

test('players Pick One submits weekly choices and links to weekly changes', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /submitPickOneChoice/)
  assert.match(file, /이번주 변경 내역/)
  assert.match(file, /href="\/players\/changes"/)
})

test('weekly changes page renders latest applied rating changes', () => {
  const file = source('app/players/changes/page.tsx')

  assert.match(file, /getLatestPickOneRatingChanges/)
  assert.match(file, /이전 오버롤/)
  assert.match(file, /이후 오버롤/)
})

test('pick one action stores one weekly choice per user and unordered pair', () => {
  const file = source('lib/actions/player-pick-one.ts')

  assert.match(file, /submitPickOneChoice/)
  assert.match(file, /getKstWeekStart/)
  assert.match(file, /player_a_id/)
  assert.match(file, /player_b_id/)
  assert.match(file, /duplicate/)
})

test('migration creates weekly pick one tables and Sunday KST cron', () => {
  const migration = repoSource('supabase/migrations/20260617130000_add_player_pick_one_weekly_ratings.sql')

  assert.match(migration, /CREATE TABLE public\.player_pick_one_choices/)
  assert.match(migration, /CREATE TABLE public\.player_pick_one_ratings/)
  assert.match(migration, /CREATE TABLE public\.player_pick_one_weekly_runs/)
  assert.match(migration, /CREATE TABLE public\.player_pick_one_rating_changes/)
  assert.match(migration, /apply_player_pick_one_week/)
  assert.match(migration, /0 15 \* \* 6/)
})
