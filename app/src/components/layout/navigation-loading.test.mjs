import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const componentFile = readFileSync(new URL('./NavigationLoading.tsx', import.meta.url), 'utf8')
const layoutFile = readFileSync(new URL('../../app/layout.tsx', import.meta.url), 'utf8')

test('root layout includes a client-side navigation loading indicator', () => {
  assert.match(layoutFile, /import \{ NavigationLoading \}/)
  assert.match(layoutFile, /<NavigationLoading \/>/)
})

test('navigation loading indicator reacts to internal link clicks', () => {
  assert.match(componentFile, /'use client'/)
  assert.match(componentFile, /document\.addEventListener\('click'/)
  assert.match(componentFile, /closest\('a\[href\]'\)/)
  assert.match(componentFile, /setIsLoading\(true\)/)
  assert.match(componentFile, /usePathname\(\)/)
  assert.match(componentFile, /role="status"/)
  assert.match(componentFile, /페이지를 불러오는 중/)
  assert.match(componentFile, /aria-hidden="true"/)
  assert.match(componentFile, /animate-skeleton/)
  assert.match(componentFile, /rounded-lg/)
  assert.doesNotMatch(componentFile, /animate-spin/)
})
