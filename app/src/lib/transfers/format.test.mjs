import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTransferClubLabel,
  getTransferClubPrefix,
  getTransferDirectionLabel,
} from './format.ts'

test('formats inbound transfers with In label and from prefix', () => {
  assert.equal(getTransferDirectionLabel('in'), 'In')
  assert.equal(getTransferClubPrefix('in'), 'from')
  assert.equal(getTransferClubLabel('  Celtic  '), 'Celtic')
})

test('formats outbound transfers with Out label and to prefix', () => {
  assert.equal(getTransferDirectionLabel('out'), 'Out')
  assert.equal(getTransferClubPrefix('out'), 'to')
  assert.equal(getTransferClubLabel(' Rangers '), 'Rangers')
})

test('falls back to Free Agent when club name is blank or null', () => {
  assert.equal(getTransferClubLabel('   '), 'Free Agent')
  assert.equal(getTransferClubLabel(null), 'Free Agent')
})
