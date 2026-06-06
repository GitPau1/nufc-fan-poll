import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

function source(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8')
}

test('post feed loads viewer-specific state after the public feed renders', () => {
  const feed = source('PostFeedClient.tsx')
  const actions = fs.readFileSync(path.join(__dirname, '../../lib/actions/posts.ts'), 'utf8')

  assert.match(actions, /export async function getPostViewerState/)
  assert.match(feed, /getPostViewerState\(/)
  assert.doesNotMatch(feed, /isLoggedIn,\n}: \{\n  initialPosts: PostListItem\[\]\n  isLoggedIn: boolean\n\}/)
})
