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

  assert.match(file, /const featuredPoll = effectivePolls\[0\] \?\? null/)
  assert.doesNotMatch(file, /const featuredPoll = visiblePolls\[0\] \?\? null/)
})
