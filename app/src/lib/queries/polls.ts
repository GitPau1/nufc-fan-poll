import { createClient, createPublicClient } from '@/lib/supabase/server'
import type { PollType, PollStatus, PlayerRow, PollOptionRow } from '@/types/database'
import { PAGE_SIZE } from '@/lib/constants'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'
import { getRatingGrade, sortPlayersForRating } from '@/lib/polls/rating'
import { getEffectivePollStatus } from '@/lib/polls/status'
import { countRatingParticipantsByPoll } from '@/lib/polls/participation'
import {
  mockGetPollList,
  mockGetPollById,
  mockGetVoteCounts,
  mockGetMyVote,
} from '@/lib/mock/queries'

export { PAGE_SIZE }

// ── 목록용 타입 ──────────────────────────────────────────────
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

// ── 상세용 타입 ──────────────────────────────────────────────
export type PollDetail = {
  id: string
  type: PollType
  title: string
  description: string | null
  status: PollStatus
  thumbnail_url?: string | null
  scheduled_at?: string | null
  closes_at: string
  player_id: string | null
  created_by?: string | null
  creator_name?: string | null
  player: PlayerRow | null
  poll_options: PollOptionRow[]
  /** Type B 전용: option.player_id → PlayerRow 맵 */
  option_players?: Record<string, PlayerRow>
  current_season_stats?: Record<string, PollPlayerSeasonStats>
}

export type VoteCountMap = Record<string, number>  // option_id → count

export type PollPlayerSeasonStats = {
  appearances: number
  goals: number
  assists: number
}

export type RatingCommentItem = {
  id: string
  player_id: string
  score: number
  grade: string
  comment: string
  created_at: string
  like_count: number
  is_liked: boolean
  user: { display_name: string | null; avatar_url: string | null }
}

export type RatingResultItem = {
  player: PlayerRow
  average_score: number
  grade: string
  vote_count: number
  top_comments: RatingCommentItem[]
}

export type PollFormPlayer = Pick<PlayerRow, 'id' | 'name' | 'position' | 'squad_number' | 'photo_url' | 'is_active' | 'squad_status'>

// 쿼리 결과의 raw 타입 (supabase-js join 추론 한계로 명시적 cast 사용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

async function getRatingParticipantCounts(
  supabase: AnyRow,
  pollIds: string[]
): Promise<Map<string, number>> {
  if (pollIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('rating_votes')
    .select('poll_id, user_id')
    .in('poll_id', pollIds) as { data: Array<{ poll_id: string; user_id: string }> | null; error: AnyRow }

  if (error || !data) return new Map()
  return countRatingParticipantsByPoll(data)
}

function isMissingColumnError(error: AnyRow): boolean {
  const message = String(error?.message ?? '')
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    (message.includes('schema cache') && (message.includes('image_url') || message.includes('description')))
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
    .select('id, email, display_name')
    .in('id', uniqueIds) as { data: Array<{ id: string; email: string; display_name: string | null }> | null; error: AnyRow }

  if (error || !data) return new Map()

  return new Map(
    data
      .filter(user => !isAdmin(user.email))
      .map(user => [user.id, user.display_name ?? '이름 없는 사용자'])
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

// ── 투표 목록 조회 ────────────────────────────────────────────
export async function getPollList(page = 0): Promise<PollListItem[]> {
  if (IS_MOCK) return mockGetPollList(page)
  const supabase = createPublicClient()
  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let { data, error } = await supabase
    .from('polls')
    .select(`
      id, type, title, description, status, thumbnail_url, closes_at, scheduled_at, created_at, player_id, created_by,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status),
      poll_options(id, label, description, player_id, image_url, display_order),
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
        poll_options(id, label, player_id, display_order),
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
  const overallRatingPollIds = rows
    .filter((row: AnyRow) => row.type === 'overall_rating')
    .map((row: AnyRow) => row.id as string)
  const [creatorNames, ratingParticipantCounts] = await Promise.all([
    getCreatorNamesById(rows.map((row: AnyRow) => row.created_by as string)),
    getRatingParticipantCounts(supabase, overallRatingPollIds),
  ])
  return rows.map((row: AnyRow) => ({
    id:           row.id          as string,
    type:         row.type        as PollType,
    title:        row.title       as string,
    description:  row.description as string | null,
    status:       getEffectivePollStatus({
      status: row.status as PollStatus,
      scheduled_at: row.scheduled_at as string | null,
      closes_at: row.closes_at as string,
    }, now),
    thumbnail_url: row.thumbnail_url as string | null,
    closes_at:    row.closes_at   as string,
    scheduled_at: row.scheduled_at as string | null,
    created_at:   row.created_at  as string,
    player_id:    row.player_id   as string | null,
    created_by:   row.created_by  as string | null,
    creator_name: creatorNames.get(row.created_by as string) ?? null,
    player:       normalizePlayer(row.player as PlayerRow | null),
    poll_options: (row.poll_options as PollOptionRow[]) ?? [],
    // supabase 집계: [{count: N}] 형태로 반환
    vote_count:   row.type === 'overall_rating'
      ? ratingParticipantCounts.get(row.id as string) ?? 0
      : (row.vote_count as { count: number }[])?.[0]?.count ?? 0,
  }))
}

// ── 투표 상세 조회 ────────────────────────────────────────────
export async function getPollById(id: string): Promise<PollDetail | null> {
  if (IS_MOCK) return mockGetPollById(id)
  const supabase = await createClient()

  let { data, error } = await supabase
    .from('polls')
    .select(`
      id, type, title, description, status, thumbnail_url, scheduled_at, closes_at, player_id, created_by,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status),
      poll_options(id, label, description, player_id, image_url, display_order,
        option_player:players(id, name, position, squad_number, photo_url, is_active, squad_status))
    `)
    .eq('id', id)
    .single() as { data: AnyRow | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('polls')
      .select(`
        id, type, title, description, status, scheduled_at, closes_at, player_id, created_by,
        player:players(id, name, position, squad_number, photo_url, is_active),
        poll_options(id, label, player_id, display_order,
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

  // Type B: option_player 맵 구성
  const option_players: Record<string, PlayerRow> = {}
  for (const opt of (data.poll_options as AnyRow[]) ?? []) {
    if (opt.player_id && opt.option_player) {
      option_players[opt.player_id] = normalizePlayer(opt.option_player as PlayerRow) as PlayerRow
    }
  }

  const currentSeasonStats = await getCurrentSeasonStatsForOptions(
    supabase,
    data.type as PollType,
    options
  )
  const creatorNames = await getCreatorNamesById(data.created_by ? [data.created_by as string] : [])

  return {
    id:           data.id          as string,
    type:         data.type        as PollType,
    title:        data.title       as string,
    description:  data.description as string | null,
    status:       getEffectivePollStatus({
      status: data.status as PollStatus,
      scheduled_at: data.scheduled_at as string | null,
      closes_at: data.closes_at as string,
    }),
    thumbnail_url: data.thumbnail_url as string | null,
    scheduled_at: data.scheduled_at as string | null,
    closes_at:    data.closes_at   as string,
    player_id:    data.player_id   as string | null,
    created_by:   data.created_by  as string | null,
    creator_name: creatorNames.get(data.created_by as string) ?? null,
    player:       normalizePlayer(data.player as PlayerRow | null),
    poll_options: options,
    ...(Object.keys(option_players).length > 0 && { option_players }),
    ...(Object.keys(currentSeasonStats).length > 0 && { current_season_stats: currentSeasonStats }),
  }
}

// ── 투표 결과 집계 ────────────────────────────────────────────
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

// ── 내 투표 조회 ──────────────────────────────────────────────
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

export async function getMyRatingVoteCount(pollId: string, userId: string): Promise<number> {
  if (IS_MOCK) {
    const { cookies } = await import('next/headers')
    const jar = await cookies()
    return jar.get(`mock-rating-vote-${pollId}`)?.value === 'true' ? Number.MAX_SAFE_INTEGER : 0
  }
  const supabase = await createClient()

  const { count } = await supabase
    .from('rating_votes')
    .select('id', { count: 'exact', head: true })
    .eq('poll_id', pollId)
    .eq('user_id', userId) as { count: number | null }

  return count ?? 0
}

export async function getRatingResults(poll: PollDetail, userId: string | null): Promise<RatingResultItem[]> {
  if (IS_MOCK) return []
  const supabase = await createClient()
  const targetPlayerIds = poll.poll_options
    .map(option => option.player_id)
    .filter((id): id is string => !!id)

  if (targetPlayerIds.length === 0) return []

  const { data: voteRows } = await supabase
    .from('rating_votes')
    .select(`
      id, target_player_id, user_id, score, comment, created_at,
      user:public_profiles!rating_votes_public_profiles_user_id_fkey(display_name, avatar_url),
      like_count:rating_vote_likes(count)
    `)
    .eq('poll_id', poll.id) as { data: AnyRow[] | null; error: AnyRow }

  const { data: myLikes } = userId
    ? await supabase
      .from('rating_vote_likes')
      .select('rating_vote_id')
      .eq('user_id', userId) as { data: { rating_vote_id: string }[] | null; error: AnyRow }
    : { data: [] }

  const likedIds = new Set((myLikes ?? []).map(row => row.rating_vote_id))
  const votes = voteRows ?? []

  const players = targetPlayerIds
    .map(playerId => poll.option_players?.[playerId] ?? null)
    .filter((player): player is PlayerRow => !!player)

  return sortPlayersForRating(players).map(player => {
    const playerVotes = votes.filter(row => row.target_player_id === player.id)
    const voteCount = playerVotes.length
    const average = voteCount === 0
      ? 0
      : playerVotes.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / voteCount
    const topComments = playerVotes
      .filter(row => String(row.comment ?? '').trim().length > 0)
      .map(row => ({
        id: row.id as string,
        player_id: row.target_player_id as string,
        score: Number(row.score ?? 0),
        grade: getRatingGrade(Number(row.score ?? 0)),
        comment: String(row.comment ?? ''),
        created_at: row.created_at as string,
        like_count: (row.like_count as { count: number }[])?.[0]?.count ?? 0,
        is_liked: likedIds.has(row.id as string),
        user: {
          display_name: row.user?.display_name ?? null,
          avatar_url: row.user?.avatar_url ?? null,
        },
      }))
      .sort((a, b) => b.like_count - a.like_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      player,
      average_score: Math.round(average * 10) / 10,
      grade: getRatingGrade(average),
      vote_count: voteCount,
      top_comments: topComments,
    }
  })
}

async function getCurrentSeasonStatsForOptions(
  supabase: AnyRow,
  pollType: PollType,
  options: PollOptionRow[]
): Promise<Record<string, PollPlayerSeasonStats>> {
  if (pollType !== 'overall_rating') return {}
  const playerIds = options.map(option => option.player_id).filter((id): id is string => !!id)
  if (playerIds.length === 0) return {}

  const { data: status } = await supabase
    .from('club_status')
    .select('current_season_id')
    .eq('id', 1)
    .single() as { data: { current_season_id: string | null } | null; error: AnyRow }

  if (!status?.current_season_id) return {}

  const { data, error } = await supabase
    .from('player_season_stats')
    .select('player_id, appearances, goals, assists')
    .eq('season_id', status.current_season_id)
    .in('player_id', playerIds) as { data: AnyRow[] | null; error: AnyRow }

  if (error || !data) return {}
  return data.reduce<Record<string, PollPlayerSeasonStats>>((acc, row) => {
    acc[row.player_id as string] = {
      appearances: Number(row.appearances ?? 0),
      goals: Number(row.goals ?? 0),
      assists: Number(row.assists ?? 0),
    }
    return acc
  }, {})
}
