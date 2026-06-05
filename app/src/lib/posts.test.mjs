import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const sourcePath = path.join(__dirname, 'posts.ts')

function loadPostsModule() {
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

test('normalizes valid free post input', () => {
  const { normalizePostInput } = loadPostsModule()

  assert.deepEqual(normalizePostInput({
    type: 'free',
    content: '  이 소식 꽤 흥미롭네요 다음 시즌 기대됩니다  ',
    url: '',
  }), {
    type: 'free',
    content: '이 소식 꽤 흥미롭네요 다음 시즌 기대됩니다',
    url: null,
    embed: { kind: 'none', domain: null },
  })
})

test('rejects empty, too short, and overlong post content', () => {
  const { normalizePostInput } = loadPostsModule()

  assert.deepEqual(normalizePostInput({ type: 'free', content: '   ', url: '' }), {
    error: '내용을 입력해주세요.',
  })
  assert.deepEqual(normalizePostInput({ type: 'free', content: '짧은 글입니다', url: '' }), {
    error: '게시글은 15자 이상 입력해주세요.',
  })
  assert.deepEqual(normalizePostInput({ type: 'free', content: 'a'.repeat(301), url: '' }), {
    error: '게시글은 300자 이하로 입력해주세요.',
  })
})

test('requires official posts to include a url', () => {
  const { normalizePostInput } = loadPostsModule()

  assert.deepEqual(normalizePostInput({ type: 'official', content: '공식 발표 내용을 공유하는 게시글입니다', url: '' }), {
    error: '오피셜 소식은 출처 URL이 필요합니다.',
  })
})

test('normalizes urls and detects embed kinds', () => {
  const { normalizePostInput } = loadPostsModule()

  assert.deepEqual(normalizePostInput({
    type: 'info',
    content: '영상 참고하기 좋은 분석 글입니다',
    url: 'youtube.com/watch?v=abc123',
  }), {
    type: 'info',
    content: '영상 참고하기 좋은 분석 글입니다',
    url: 'https://youtube.com/watch?v=abc123',
    embed: { kind: 'youtube', domain: 'youtube.com', youtubeId: 'abc123' },
  })

  assert.deepEqual(normalizePostInput({
    type: 'info',
    content: 'X 게시글을 참고하면 좋겠습니다',
    url: 'https://x.com/NUFC/status/123',
  }), {
    type: 'info',
    content: 'X 게시글을 참고하면 좋겠습니다',
    url: 'https://x.com/NUFC/status/123',
    embed: { kind: 'x', domain: 'x.com' },
  })
})

test('decides reaction toggle operations', () => {
  const { getReactionToggleOperation } = loadPostsModule()

  assert.deepEqual(getReactionToggleOperation(null, 'curious'), { action: 'create', reactionType: 'curious' })
  assert.deepEqual(getReactionToggleOperation('sad', 'curious'), { action: 'update', reactionType: 'curious' })
  assert.deepEqual(getReactionToggleOperation('curious', 'curious'), { action: 'delete' })
})
