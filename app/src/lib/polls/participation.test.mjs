import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.join(__dirname, 'participation.ts')

function loadParticipationModule() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: true,
    },
  }).outputText

  const cjsModule = { exports: {} }
  const fn = new Function('exports', 'module', compiled)
  fn(cjsModule.exports, cjsModule)
  return cjsModule.exports
}

test('counts overall rating participants once per user', () => {
  const { countRatingParticipantsByPoll } = loadParticipationModule()

  assert.deepEqual(
    countRatingParticipantsByPoll([
      { poll_id: 'season-review', user_id: 'user-1' },
      { poll_id: 'season-review', user_id: 'user-1' },
      { poll_id: 'season-review', user_id: 'user-2' },
      { poll_id: 'other-poll', user_id: 'user-3' },
    ]),
    new Map([
      ['season-review', 2],
      ['other-poll', 1],
    ])
  )
})
