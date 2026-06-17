import { unstable_cache } from 'next/cache'
import { createClient, createPublicClient } from '@/lib/supabase/server'
import type { PollType, PollStatus, PlayerRow, PollOptionRow } from '@/types/database'
import { PAGE_SIZE } from '@/lib/constants'
import { IS_MOCK } from '@/lib/config'
import { getEffectivePollStatus } from '@/lib/polls/status'
import {
  mockGetPollList,
  mockGetPollById,
  mockGetVoteCounts,
  mockGetMyVote,
} from '@/lib/mock/queries'

export { PAGE_SIZE }

export type PollListItem = {
  id: string
  type: PollType
  title: string
  description?: string | null
  status: PollStatus
  thumbnail_url?: string | null
  closes_at: string
  scheduled_at: string | null
  created_at: string
  player_id: string | null
  created_by?: string | null
  creator_name?: string | null
  player: PlayerRow | null
  poll_options: PollOptionRow[]
  vote_count: number
}

export type PollDetail = {
  id: string
  type: PollType
  title: string
  description: string | null
  status: PollStatus
  thumbnail_url?: string | null
  created_at?: string | null
  scheduled_at?: string | null
  closes_at: string
  player_id: string | null
  created_by?: string | null
  creator_name?: string | null
  player: PlayerRow | null
  poll_options: PollOptionRow[]
  option_players?: Record<string, PlayerRow>
}

export type VoteCountMap = Record<string, number>
export type PollFormPlayer = Pick<PlayerRow, 'id' | 'name' | 'position' | 'squad_number' | 'photo_url' | 'is_active' | 'squad_status'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

function isMissingColumnError(error: AnyRow): boolean {
  const message = String(error?.message ?? '')
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('schema cache') && (message.includes('image_url') || message.includes('description') || message.includes('squad_status')))
  )
}

function normalizePlayer(player: PlayerRow | null): PlayerRow | null {
  if (!player) return null
  return {
    ...player,
    squad_status: player.squad_status ?? 'first_team',
  }
}

async function getCreatorNamesById(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (uniqueIds.length === 0) return new Map()

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', uniqueIds) as { data: Array<{ id: string; display_name: string | null }> | null; error: AnyRow }

  if (error || !data) return new Map()

  return new Map(
    data.map(user => [user.id, user.display_name ?? '이름 없는 사용자'])
  )
}

export async function getPollFormPlayers(): Promise<PollFormPlayer[]> {
  if (IS_MOCK) {
    const { MOCK_PLAYERS } = await import('@/lib/mock/data')
    return MOCK_PLAYERS
  }

  const supabase = await createClient()
  let { data, error } = await supabase
    .from('players')
    .select('id, name, position, squad_number, photo_url, is_active, squad_status')
    .order('squad_number', { ascending: true }) as { data: AnyRow[] | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('players')
      .select('id, name, position, squad_number, photo_url, is_active')
      .order('squad_number', { ascending: true }) as { data: AnyRow[] | null; error: AnyRow }
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('getPollFormPlayers error:', error)
    return []
  }

  return (data ?? []).map((player: AnyRow) => ({
    id: player.id as string,
    name: player.name as string,
    position: player.position as PlayerRow['position'],
    squad_number: player.squad_number as number | null,
    photo_url: player.photo_url as string | null,
    is_active: player.is_active as boolean,
    squad_status: (player.squad_status ?? 'first_team') as PlayerRow['squad_status'],
  }))
}

async function getPollListUncached(page = 0): Promise<PollListItem[]> {
  if (IS_MOCK) return mockGetPollList(page)
  const supabase = createPublicClient()
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let { data, error } = await supabase
    .from('polls')
    .select(`
      id, type, title, description, status, thumbnail_url, closes_at, scheduled_at, created_at, player_id, created_by,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status),
      poll_options(id, poll_id, label, description, player_id, image_url, display_order, created_at),
      vote_count:votes(count)
    `)
    .order('created_at', { ascending: false })
    .range(from, to) as { data: AnyRow[] | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('polls')
      .select(`
        id, type, title, description, status, closes_at, scheduled_at, created_at, player_id, created_by,
        player:players(id, name, position, squad_number, photo_url, is_active),
        poll_options(id, poll_id, label, player_id, display_order, created_at),
        vote_count:votes(count)
      `)
      .order('created_at', { ascending: false })
      .range(from, to) as { data: AnyRow[] | null; error: AnyRow }

    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('getPollList error:', error)
    return []
  }

  const now = new Date()
  const rows = data ?? []
  const creatorNames = await getCreatorNamesById(rows.map((row: AnyRow) => row.created_by as string))

  return rows.map((row: AnyRow) => ({
    id: row.id as string,
    type: row.type as PollType,
    title: row.title as string,
    description: row.description as string | null,
    status: getEffectivePollStatus({
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
    vote_count: (row.vote_count as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export const getPollList = unstable_cache(getPollListUncached, ['public-poll-list'], {
  revalidate: 30,
})

export async function getPollById(id: string): Promise<PollDetail | null> {
  if (IS_MOCK) return mockGetPollById(id)
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('polls')
    .select(`
      id, type, title, description, status, thumbnail_url, created_at, scheduled_at, closes_at, player_id, created_by,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status),
      poll_options(id, poll_id, label, description, player_id, image_url, display_order, created_at,
        option_player:players(id, name, position, squad_number, photo_url, is_active, squad_status))
    `)
    .eq('id', id)
    .single() as { data: AnyRow | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('polls')
      .select(`
        id, type, title, description, status, created_at, scheduled_at, closes_at, player_id, created_by,
        player:players(id, name, position, squad_number, photo_url, is_active),
        poll_options(id, poll_id, label, player_id, display_order, created_at,
          option_player:players(id, name, position, squad_number, photo_url, is_active))
      `)
      .eq('id', id)
      .single() as { data: AnyRow | null; error: AnyRow }

    data = fallback.data
    error = fallback.error
  }

  if (error || !data) return null

  const options: PollOptionRow[] = ((data.poll_options as AnyRow[]) ?? [])
    .sort((a: AnyRow, b: AnyRow) => a.display_order - b.display_order)

  const option_players: Record<string, PlayerRow> = {}
  for (const opt of (data.poll_options as AnyRow[]) ?? []) {
    if (opt.player_id && opt.option_player) {
      option_players[opt.player_id] = normalizePlayer(opt.option_player as PlayerRow) as PlayerRow
    }
  }

  const creatorNames = await getCreatorNamesById(data.created_by ? [data.created_by as string] : [])

  return {
    id: data.id as string,
    type: data.type as PollType,
    title: data.title as string,
    description: data.description as string | null,
    status: getEffectivePollStatus({
      status: data.status as PollStatus,
      scheduled_at: data.scheduled_at as string | null,
      closes_at: data.closes_at as string,
    }),
    thumbnail_url: data.thumbnail_url as string | null,
    created_at: data.created_at as string | null,
    scheduled_at: data.scheduled_at as string | null,
    closes_at: data.closes_at as string,
    player_id: data.player_id as string | null,
    created_by: data.created_by as string | null,
    creator_name: creatorNames.get(data.created_by as string) ?? null,
    player: normalizePlayer(data.player as PlayerRow | null),
    poll_options: options,
    ...(Object.keys(option_players).length > 0 && { option_players }),
  }
}

export async function getVoteCounts(pollId: string): Promise<VoteCountMap> {
  if (IS_MOCK) return mockGetVoteCounts(pollId)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('votes')
    .select('option_id')
    .eq('poll_id', pollId) as { data: { option_id: string }[] | null; error: AnyRow }

  if (error || !data) return {}

  return data.reduce<VoteCountMap>((acc, row) => {
    acc[row.option_id] = (acc[row.option_id] ?? 0) + 1
    return acc
  }, {})
}

export async function getMyVote(pollId: string, userId: string): Promise<string | null> {
  if (IS_MOCK) return mockGetMyVote(pollId, userId)
  const supabase = await createClient()

  const { data } = await supabase
    .from('votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .single() as { data: { option_id: string } | null; error: AnyRow }

  return data?.option_id ?? null
}
