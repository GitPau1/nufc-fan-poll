import type { TransferDirection as DatabaseTransferDirection } from '@/types/database'

export type TransferDirection = DatabaseTransferDirection

export function getTransferDirectionLabel(direction: TransferDirection) {
  return direction === 'in' ? 'In' : 'Out'
}

export function getTransferClubPrefix(direction: TransferDirection) {
  return direction === 'in' ? 'from' : 'to'
}

export function getTransferClubLabel(clubName: string | null) {
  const trimmedClubName = clubName?.trim()

  return trimmedClubName ? trimmedClubName : 'Free Agent'
}
