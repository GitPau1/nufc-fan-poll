export type TransferMovementGroup = 'loan' | 'permanent'

export function getTransferMovementGroup(type: string): TransferMovementGroup {
  return type === 'loan_in' || type === 'loan_out' || type === 'loan_return' ? 'loan' : 'permanent'
}

export function splitTransfersByMovementGroup<T extends { transfer_type: string }>(transfers: T[]) {
  return transfers.reduce(
    (acc, transfer) => {
      acc[getTransferMovementGroup(transfer.transfer_type)].push(transfer)
      return acc
    },
    { loan: [] as T[], permanent: [] as T[] },
  )
}
