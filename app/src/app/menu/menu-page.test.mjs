import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('menu page shows lightweight actions before rendering mypage for signed-in users', () => {
  const file = source('app/menu/page.tsx')

  assert.match(file, /getHeaderAuth/)
  assert.match(file, /<MyPage\s*\/>/)
  assert.match(file, /피드백 남기기/)
  assert.match(file, /로그인하기/)
  assert.match(file, /href="\/login\?next=\/menu"/)
})
