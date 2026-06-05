import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const headerStatusSource = fs.readFileSync(path.join(__dirname, 'HeaderAuthStatus.tsx'), 'utf8')
const appHeaderSource = fs.readFileSync(path.join(__dirname, 'AppHeader.tsx'), 'utf8')

test('header auth status is rendered from server-provided auth instead of client fetch', () => {
  assert.doesNotMatch(headerStatusSource, /useEffect|useState|getHeaderAuth/)
  assert.match(headerStatusSource, /auth\s*:\s*HeaderAuth\s*\|\s*null/)
  assert.match(appHeaderSource, /async function AppHeader/)
  assert.match(appHeaderSource, /getHeaderAuth\(\)/)
  assert.match(appHeaderSource, /<HeaderAuthStatus auth=\{auth\}/)
})
