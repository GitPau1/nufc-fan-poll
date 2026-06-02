import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const sourcePath = path.join(__dirname, 'feedback.ts')

function loadFeedbackModule() {
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

test('normalizes feedback content for storage', () => {
  const { normalizeFeedbackContent } = loadFeedbackModule()

  assert.deepEqual(normalizeFeedbackContent('  좋은 기능이에요  '), {
    content: '좋은 기능이에요',
  })
})

test('rejects empty feedback content', () => {
  const { normalizeFeedbackContent } = loadFeedbackModule()

  assert.deepEqual(normalizeFeedbackContent('   '), {
    error: '피드백을 입력해주세요.',
  })
})

test('rejects feedback content over 500 characters', () => {
  const { normalizeFeedbackContent } = loadFeedbackModule()

  assert.deepEqual(normalizeFeedbackContent('a'.repeat(501)), {
    error: '피드백은 500자 이하로 입력해주세요.',
  })
})
