import { createPublicClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/config'
import { getTransferMovementGroup, type TransferMovementGroup } from '@/lib/transfers/group'
import type { PlayerRow, TransferDirection, TransferTableRow, TransferType } from '@/types/database'

type AnyRow = Record<string, unknown>

export type TransferItem = TransferTableRow & {
  movement_group: TransferMovementGroup
  season_id: string | null
  season_record: { id: string; name: string } | null
  player: Pick<PlayerRow, 'id' | 'name' | 'photo_url'> | null
}

const MOCK_TRANSFER_ROWS: Array<Omit<TransferItem, 'movement_group'>> = [
  {
    id: 'transfer-1',
    player_id: 'p-new',
    direction: 'in',
    transfer_type: 'signing',
    season: '2025-26',
    season_id: 'season-2025',
    season_record: { id: 'season-2025', name: '2025-26' },
    club_name: 'Real Sociedad',
    note: null,
    is_published: true,
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 3_600_000).toISOString(),
    player: {
      id: 'p-new',
      name: 'Alexander Isak',
      photo_url: null,
    },
  },
  {
    id: 'transfer-2',
    player_id: 'p-out',
    direction: 'out',
    transfer_type: 'released',
    season: '2025-26',
    season_id: 'season-2025',
    season_record: { id: 'season-2025', name: '2025-26' },
    club_name: null,
    note: null,
    is_published: true,
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
    updated_at: new Date(Date.now() - 7_200_000).toISOString(),
    player: {
      id: 'p-out',
      name: 'Callum Wilson',
      photo_url: null,
    },
  },
]

const MOCK_TRANSFERS: TransferItem[] = MOCK_TRANSFER_ROWS.map(transfer => ({
  ...transfer,
  movement_group: getTransferMovementGroup(transfer.transfer_type),
}))

function isMissingRelationError(error: AnyRow | null | undefined): boolean {
  const message = String(error?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

function isMissingColumnError(error: AnyRow | null | undefined): boolean {
  const message = String(error?.message ?? '')
  return message.includes('column') && message.includes('does not exist')
}

function normalizeDirection(value: unknown): TransferDirection {
  return value === 'in' ? 'in' : 'out'
}

function normalizeType(value: unknown): TransferType {
  const transferType = String(value ?? '')
  return (
    transferType === 'signing' ||
    transferType === 'loan_in' ||
    transferType === 'promotion' ||
    transferType === 'loan_return' ||
    transferType === 'transferred' ||
    transferType === 'contract_expired' ||
    transferType === 'loan_out' ||
    transferType === 'released'
  ) ? transferType : 'released'
}

function mapTransferRow(row: AnyRow): TransferItem {
  const player = row.player as PlayerRow | PlayerRow[] | null | undefined
  const normalizedPlayer = Array.isArray(player) ? (player[0] ?? null) : (player ?? null)
  const transferType = normalizeType(row.transfer_type)
  const season = row.season_record ?? row.season
  const normalizedSeason = Array.isArray(season) ? (season[0] ?? null) : (season ?? null)

  return {
    id: String(row.id),
    player_id: String(row.player_id),
    direction: normalizeDirection(row.direction),
    transfer_type: transferType,
    movement_group: getTransferMovementGroup(transferType),
    season: String(row.season ?? (typeof normalizedSeason === 'object' && normalizedSeason !== null ? (normalizedSeason as AnyRow).name : '')),
    season_id: typeof row.season_id === 'string' ? row.season_id : null,
    season_record: normalizedSeason && typeof normalizedSeason === 'object'
      ? { id: String((normalizedSeason as AnyRow).id), name: String((normalizedSeason as AnyRow).name) }
      : null,
    club_name: typeof row.club_name === 'string' ? row.club_name : null,
    note: typeof row.note === 'string' ? row.note : null,
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    player: normalizedPlayer ? {
      id: normalizedPlayer.id,
      name: normalizedPlayer.name,
      photo_url: normalizedPlayer.photo_url,
    } : null,
  }
}

export async function getTransfersBySeason(season: string): Promise<TransferItem[]> {
  if (!season.trim()) return []
  if (IS_MOCK) return MOCK_TRANSFERS.filter(transfer => transfer.season === season)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      id, player_id, direction, transfer_type, season, club_name, note, is_published, created_at, updated_at,
      season_record:seasons(id, name),
      player:players(id, name, photo_url)
    `)
    .eq('season', season)
    .eq('is_published', true)
    .order('created_at', { ascending: false }) as { data: AnyRow[] | null; error: AnyRow | null }

  if (error && (isMissingRelationError(error) || isMissingColumnError(error))) return []
  if (error || !data) return []
  return data.map(mapTransferRow)
}

export async function getTransfersBySeasonId(seasonId: string): Promise<TransferItem[]> {
  if (!seasonId.trim()) return []
  if (IS_MOCK) return MOCK_TRANSFERS.filter(transfer => transfer.season_id === seasonId || transfer.season_record?.id === seasonId)

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      id, player_id, direction, transfer_type, season, season_id, club_name, note, is_published, created_at, updated_at,
      season_record:seasons(id, name),
      player:players(id, name, photo_url)
    `)
    .eq('season_id', seasonId)
    .eq('is_published', true)
    .order('created_at', { ascending: false }) as { data: AnyRow[] | null; error: AnyRow | null }

  if (error && (isMissingRelationError(error) || isMissingColumnError(error))) return []
  if (error || !data) return []
  return data.map(mapTransferRow)
}

export async function getLatestTransfersBySeasonId(seasonId: string, limit = 5): Promise<TransferItem[]> {
  const transfers = await getTransfersBySeasonId(seasonId)
  return transfers.slice(0, limit)
}
