import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const resultView = readFileSync(new URL('./ResultView.tsx', import.meta.url), 'utf8')
const commentsSection = readFileSync(new URL('./CommentsSection.tsx', import.meta.url), 'utf8')

test('result page keeps the Figma-sized cover image', () => {
  assert.match(resultView, /h-\[252px\]/)
  assert.doesNotMatch(resultView, /h-\[188px\]/)
})

test('result page uses a Figma-specific header instead of the shared poll header', () => {
  assert.doesNotMatch(resultView, /PollPageHeader/)
})

test('result page omits sections that are not in the Figma result frame', () => {
  assert.doesNotMatch(resultView, /선수 정보/)
})

test('comments use the Figma thumbs-up reaction treatment', () => {
  assert.match(commentsSection, /ThumbsUp/)
  assert.doesNotMatch(commentsSection, /Heart/)
})

test('result page renders all options as Figma-style percentage bars', () => {
  assert.match(resultView, /resultItems\.map/)
  assert.match(resultView, /width: `\$\{item\.percent\}%`/)
  assert.doesNotMatch(resultView, /slice\(1\)/)
  assert.doesNotMatch(resultView, /text-\[40px\]/)
})

test('result page adds Figma-style option thumbnails only for image or player options', () => {
  assert.match(resultView, /getOptionThumb/)
  assert.match(resultView, /option\.image_url/)
  assert.match(resultView, /poll\.option_players/)
  assert.match(resultView, /size-\[40px\]/)
  assert.match(resultView, /thumb \?/ )
  assert.doesNotMatch(resultView, /placehold\.co\/40x40/)
})

test('comment composer keeps the Figma input proportions', () => {
  assert.match(commentsSection, /h-\[62px\]/)
  assert.match(commentsSection, /rounded-\[16px\]/)
})
