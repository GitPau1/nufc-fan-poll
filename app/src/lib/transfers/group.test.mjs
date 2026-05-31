import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTransferMovementGroup,
  splitTransfersByMovementGroup,
} from './group.ts'

test('loan transfer variants are grouped as loan', () => {
  assert.equal(getTransferMovementGroup('loan_in'), 'loan')
  assert.equal(getTransferMovementGroup('loan_out'), 'loan')
  assert.equal(getTransferMovementGroup('loan_return'), 'loan')
})

test('non-loan transfer types are grouped as permanent', () => {
  assert.equal(getTransferMovementGroup('signing'), 'permanent')
  assert.equal(getTransferMovementGroup('promotion'), 'permanent')
  assert.equal(getTransferMovementGroup('transferred'), 'permanent')
  assert.equal(getTransferMovementGroup('contract_expired'), 'permanent')
  assert.equal(getTransferMovementGroup('released'), 'permanent')
})

test('splitTransfersByMovementGroup preserves order within each bucket', () => {
  const transfers = [
    { id: '1', transfer_type: 'loan_out' },
    { id: '2', transfer_type: 'signing' },
    { id: '3', transfer_type: 'loan_in' },
    { id: '4', transfer_type: 'released' },
  ]

  const grouped = splitTransfersByMovementGroup(transfers)

  assert.deepEqual(grouped.loan.map((item) => item.id), ['1', '3'])
  assert.deepEqual(grouped.permanent.map((item) => item.id), ['2', '4'])
})
