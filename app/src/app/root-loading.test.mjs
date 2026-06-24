import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const loadingFile = readFileSync(new URL('./loading.tsx', import.meta.url), 'utf8')

test('root route renders a full-page loading motion for page transitions', () => {
  assert.match(loadingFile, /export default function Loading\(\)/)
  assert.match(loadingFile, /role="status"/)
  assert.match(loadingFile, /aria-label="페이지를 불러오는 중"/)
  assert.match(loadingFile, /min-h-screen/)
  assert.match(loadingFile, /max-w-\[480px\]/)
  assert.match(loadingFile, /flex-1/)
  assert.match(loadingFile, /페이지를 불러오는 중/)
  assert.doesNotMatch(loadingFile, /animate-skeleton/)
  assert.doesNotMatch(loadingFile, /rounded-lg/)
  assert.doesNotMatch(loadingFile, /animate-spin/)
})
