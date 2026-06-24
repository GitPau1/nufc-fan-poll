import type { PollDetail, PollListItem, PollPlayerSeasonStats } from '@/lib/queries/polls'
import type { PlayerRow, PollOptionRow, PollStatus, PollType } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

type ResolveStatus = (
  input: { status: PollStatus; scheduled_at: string | null; closes_at: string },
  now?: Date
) => PollStatus

export function normalizePlayer(player: PlayerRow | null): PlayerRow | null {
  if (!player) return null
  return {
    ...player,
    squad_status: player.squad_status ?? 'first_team',
  }
}

export function mapPollListRow(
  row: AnyRow,
  {
    now,
    creatorNames,
    ratingParticipantCounts,
    resolveStatus,
  }: {
    now: Date
    creatorNames: Map<string, string>
    ratingParticipantCounts: Map<string, number>
    resolveStatus: ResolveStatus
  }
): PollListItem {
  return {
    id: row.id as string,
    type: row.type as PollListItem['type'],
    title: row.title as string,
    description: row.description as string | null,
    status: resolveStatus({
      status: row.status as PollStatus,
      scheduled_at: row.scheduled_at as string | null,
      closes_at: row.closes_at as string,
    }, now),
    thumbnail_url: row.thumbnail_url as string | null,
    closes_at: row.closes_at as string,
    scheduled_at: row.scheduled_at as string | null,
    created_at: row.created_at as string,
    player_id: row.player_id as string | null,
    created_by: row.created_by as string | null,
    creator_name: creatorNames.get(row.created_by as string) ?? null,
    player: normalizePlayer(row.player as PlayerRow | null),
    poll_options: (row.poll_options as PollOptionRow[]) ?? [],
    vote_count: row.type === 'overall_rating'
      ? ratingParticipantCounts.get(row.id as string) ?? 0
      : (row.vote_count as { count: number }[])?.[0]?.count ?? 0,
  }
}

export function mapPollDetailRow(
  row: AnyRow,
  {
    creatorNames,
    currentSeasonStats,
    resolveStatus,
  }: {
    creatorNames: Map<string, string>
    currentSeasonStats: Record<string, PollPlayerSeasonStats>
    resolveStatus: ResolveStatus
  }
): PollDetail {
  const options: PollOptionRow[] = ((row.poll_options as AnyRow[]) ?? [])
    .slice()
    .sort((a: AnyRow, b: AnyRow) => a.display_order - b.display_order)

  const option_players: Record<string, PlayerRow> = {}
  for (const opt of (row.poll_options as AnyRow[]) ?? []) {
    if (opt.player_id && opt.option_player) {
      option_players[opt.player_id] = normalizePlayer(opt.option_player as PlayerRow) as PlayerRow
    }
  }

  return {
    id: row.id as string,
    type: row.type as PollType,
    title: row.title as string,
    description: row.description as string | null,
    status: resolveStatus({
      status: row.status as PollStatus,
      scheduled_at: row.scheduled_at as string | null,
      closes_at: row.closes_at as string,
    }),
    thumbnail_url: row.thumbnail_url as string | null,
    created_at: row.created_at as string | null,
    scheduled_at: row.scheduled_at as string | null,
    closes_at: row.closes_at as string,
    player_id: row.player_id as string | null,
    created_by: row.created_by as string | null,
    creator_name: creatorNames.get(row.created_by as string) ?? null,
    player: normalizePlayer(row.player as PlayerRow | null),
    poll_options: options,
    ...(Object.keys(option_players).length > 0 && { option_players }),
    ...(Object.keys(currentSeasonStats).length > 0 && { current_season_stats: currentSeasonStats }),
  }
}
