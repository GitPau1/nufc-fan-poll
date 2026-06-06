import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

function source(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8')
}

test('posts page renders public feed without blocking on server auth', () => {
  const page = source('page.tsx')

  assert.doesNotMatch(page, /getHeaderAuth|getPostList\(/)
  assert.match(page, /getPublicPostList\(/)
  assert.match(page, /<AppHeader\s*\/>/)
  assert.match(page, /<PostFeedClient initialPosts={posts}\s*\/>/)
})
