import { IS_MOCK } from '@/lib/config'
import type { ClubStatusWithStats, PlayerRow } from '@/types/database'
import type { PlayerSeasonStatItem } from '@/lib/queries/farewells'

// ── Mock data ────────────────────────────────────────────────
const MOCK_STATUS: ClubStatusWithStats = {
  id: 1,
  current_season: '2025-26',
  current_season_id: 'season-2025',
  current_season_record: { id: 'season-2025', name: '2025-26' },
  league_rank: 4,
  next_match_opponent: '맨체스터 시티',
  next_match_date: '2026-08-16T15:00:00Z',
  next_match_venue: 'home',
  top_appearances_player_id: 'p1',
  top_appearances_count: 34,
  top_goals_player_id: 'p2',
  top_goals_count: 23,
  top_assists_player_id: 'p3',
  top_assists_count: 11,
  updated_at: new Date().toISOString(),
  top_appearances_player: { id: 'p1', name: 'Nick Pope', photo_url: null },
  top_goals_player: { id: 'p2', name: 'Alexander Isak', photo_url: null },
  top_assists_player: { id: 'p3', name: 'Anthony Gordon', photo_url: null },
}

const MOCK_PLAYERS: PlayerRow[] = [
  { id: 'p1', name: 'Nick Pope',       position: 'GK',  squad_number: 1,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'England',     birth_date: '1992-04-22' },
  { id: 'p4', name: 'Kieran Trippier', position: 'DEF', squad_number: 2,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'England',     birth_date: '1990-09-19' },
  { id: 'p5', name: 'Fabian Schär',    position: 'DEF', squad_number: 5,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'Switzerland', birth_date: '1991-12-20' },
  { id: 'p3', name: 'Anthony Gordon',  position: 'MID', squad_number: 7,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'England',     birth_date: '2001-02-24' },
  { id: 'p6', name: 'Sandro Tonali',   position: 'MID', squad_number: 8,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'Italy',       birth_date: '2000-05-08' },
  { id: 'p2', name: 'Alexander Isak',  position: 'FWD', squad_number: 14,   photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'Sweden',      birth_date: '1999-09-21' },
  { id: 'p7', name: 'Callum Wilson',   position: 'FWD', squad_number: 9,    photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'England',     birth_date: '1992-02-27' },
  { id: 'p8', name: 'Eddie Howe',      position: 'MGR', squad_number: null, photo_url: null, is_active: true, squad_status: 'first_team', nationality: 'England',     birth_date: '1977-11-29' },
]

// ── getClubStatus ─────────────────────────────────────────────
export async function getClubStatus(): Promise<ClubStatusWithStats | null> {
  if (IS_MOCK) return MOCK_STATUS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('club_status')
    .select(`
      *,
      current_season_record:seasons!current_season_id(id, name),
      top_appearances_player:players!top_appearances_player_id(id, name, photo_url),
      top_goals_player:players!top_goals_player_id(id, name, photo_url),
      top_assists_player:players!top_assists_player_id(id, name, photo_url)
    `)
    .eq('id', 1)
    .single()

  if (error || !data) return null
  const currentSeasonId = (data as { current_season_id?: string | null }).current_season_id ?? null
  const leaders = await getCurrentSeasonLeaders(supabase, currentSeasonId)

  return {
    ...(data as ClubStatusWithStats),
    current_season: (data as { current_season?: string | null }).current_season ?? null,
    current_season_id: currentSeasonId,
    ...leaders,
  }
}

// ── getSquad ──────────────────────────────────────────────────
export async function getSquad(): Promise<PlayerRow[]> {
  if (IS_MOCK) return MOCK_PLAYERS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('squad_number')

  if (error && String(error.message ?? '').includes('squad_status')) {
    const fallback = await supabase
      .from('players')
      .select('id, name, position, squad_number, photo_url, is_active, nationality, birth_date')
      .eq('is_active', true)
      .order('squad_number')

    if (fallback.error || !fallback.data) return []
    return (fallback.data as Array<Omit<PlayerRow, 'squad_status'>>).map(player => ({
      ...player,
      squad_status: 'first_team',
    }))
  }

  if (error || !data) return []
  return (data as PlayerRow[]).map(player => ({
    ...player,
    squad_status: player.squad_status ?? 'first_team',
  }))
}

export type PlayerCommentItem = {
  id: string
  player_id: string
  content: string
  created_at: string
  user: { display_name: string | null; avatar_url: string | null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

function isMissingRelationError(error: AnyRow): boolean {
  const message = String(error?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

async function getCurrentSeasonLeaders(supabase: AnyRow, seasonId: string | null) {
  if (!seasonId) return {}

  const { data, error } = await supabase
    .from('player_season_stats')
    .select(`
      appearances, goals, assists,
      player:players(id, name, photo_url)
    `)
    .eq('season_id', seasonId) as { data: AnyRow[] | null; error: AnyRow }

  if (error && isMissingRelationError(error)) return {}
  if (error || !data) return {}
  const rows = data

  function pickLeader(field: 'appearances' | 'goals' | 'assists') {
    return rows
      .slice()
      .sort((a, b) => Number(b[field] ?? 0) - Number(a[field] ?? 0))
      .find(row => Number(row[field] ?? 0) > 0) ?? null
  }

  const appearances = pickLeader('appearances')
  const goals = pickLeader('goals')
  const assists = pickLeader('assists')

  return {
    top_appearances_player: appearances?.player ?? null,
    top_appearances_count: appearances ? Number(appearances.appearances ?? 0) : null,
    top_goals_player: goals?.player ?? null,
    top_goals_count: goals ? Number(goals.goals ?? 0) : null,
    top_assists_player: assists?.player ?? null,
    top_assists_count: assists ? Number(assists.assists ?? 0) : null,
  }
}

export async function getPlayerById(playerId: string): Promise<PlayerRow | null> {
  if (IS_MOCK) return MOCK_PLAYERS.find(player => player.id === playerId) ?? null

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single()

  if (error || !data) return null
  return {
    ...(data as PlayerRow),
    squad_status: (data as PlayerRow).squad_status ?? 'first_team',
  }
}

export async function getPlayerComments(playerId: string): Promise<PlayerCommentItem[]> {
  if (IS_MOCK) {
    return [
      {
        id: 'pc1',
        player_id: playerId,
        content: '이번 시즌도 기대하고 있어요.',
        created_at: new Date(Date.now() - 1800_000).toISOString(),
        user: { display_name: 'ToonArmy88', avatar_url: null },
      },
    ]
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('player_comments')
    .select(`
      id, player_id, content, created_at,
      user:public_profiles!player_comments_public_profiles_user_id_fkey(display_name, avatar_url)
    `)
    .eq('player_id', playerId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50) as { data: AnyRow[] | null; error: AnyRow }

  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    player_id: row.player_id,
    content: row.content,
    created_at: row.created_at,
    user: {
      display_name: row.user?.display_name ?? null,
      avatar_url: row.user?.avatar_url ?? null,
    },
  }))
}

export async function getPlayerStats(playerId: string): Promise<PlayerSeasonStatItem[]> {
  if (IS_MOCK) {
    return [
      { id: 'pps-2025', player_id: playerId, season: '2025-26', appearances: 34, goals: 18, assists: 6 },
      { id: 'pps-2024', player_id: playerId, season: '2024-25', appearances: 32, goals: 14, assists: 4 },
      { id: 'pps-2023', player_id: playerId, season: '2023-24', appearances: 28, goals: 10, assists: 3 },
    ]
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('player_season_stats')
    .select('id, player_id, season, season_id, appearances, goals, assists')
    .eq('player_id', playerId)
    .order('season', { ascending: false }) as { data: AnyRow[] | null; error: AnyRow }

  if (error && isMissingRelationError(error)) return []
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    player_id: row.player_id,
    season: row.season,
    season_id: row.season_id,
    appearances: row.appearances,
    goals: row.goals,
    assists: row.assists,
  }))
}

// ── calcAge ───────────────────────────────────────────────────
export function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)

  let age = today.getFullYear() - birth.getFullYear()

  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  if (!hasBirthdayPassed) age -= 1

  return age
}
