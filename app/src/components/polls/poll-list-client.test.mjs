import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('poll hero banner is selected independently of the active tab', () => {
  const file = source('components/polls/PollListClient.tsx')

  assert.match(file, /const featuredPoll = selectedFeaturedPoll \?\? fallbackFeaturedPoll/)
  assert.doesNotMatch(file, /const featuredPoll = visiblePolls\[0\] \?\? null/)
})

test('poll hero banner uses priority buckets and keeps the featured poll in the list', () => {
  const file = source('components/polls/PollListClient.tsx')

  assert.match(file, /function getFeaturedPollCandidates/)
  assert.match(file, /closingSoon/)
  assert.match(file, /activePolls/)
  assert.match(file, /closedPolls/)
  assert.match(file, /Math\.floor\(Math\.random\(\) \* candidates\.length\)/)
  assert.doesNotMatch(file, /visiblePolls\.filter\(poll => poll\.id !== featuredPoll\.id\)/)
  assert.match(file, /const listPolls = visiblePolls/)
})
