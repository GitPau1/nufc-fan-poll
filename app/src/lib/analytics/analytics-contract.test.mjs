import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('analytics source page taxonomy includes current community routes', () => {
  const file = source('lib/analytics/mixpanel.ts')

  assert.match(file, /pathname\.startsWith\('\/players\/changes'\)[\s\S]{0,60}return 'player_changes'/)
  assert.match(file, /pathname\.startsWith\('\/players'\)[\s\S]{0,60}return 'players'/)
  assert.match(file, /pathname\.startsWith\('\/my\/feedback'\)[\s\S]{0,60}return 'feedback'/)
  assert.match(file, /pathname\.startsWith\('\/menu'\)[\s\S]{0,60}return 'menu'/)
})

test('players page tracks the Pick One participation and reward loop', () => {
  const file = source('components/players/PlayersPageClient.tsx')

  assert.match(file, /trackEvent\('players_viewed'/)
  assert.match(file, /trackEvent\('pick_one_viewed'/)
  assert.match(file, /trackEvent\('pick_one_submitted'/)
  assert.match(file, /trackEvent\('pick_one_next_clicked'/)
  assert.match(file, /trackEvent\('player_rating_changes_clicked'/)
  assert.match(file, /trackEvent\('player_pick_one_auth_required'/)
})

test('player rating changes and feedback pages track community reward and high-intent feedback', () => {
  const changesAnalytics = source('components/players/PlayerRatingChangesAnalytics.tsx')
  const feedbackForm = source('components/my/MyFeedbackForm.tsx')

  assert.match(changesAnalytics, /trackEvent\('player_rating_changes_viewed'/)
  assert.match(feedbackForm, /trackEvent\('feedback_submitted'/)
})
