import { IS_MOCK } from '@/lib/config'
import type { ClubStatusWithStats, PlayerRow } from '@/types/database'

// ── Mock data ────────────────────────────────────────────────
const MOCK_STATUS: ClubStatusWithStats = {
  id: 1,
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
      top_appearances_player:players!top_appearances_player_id(id, name, photo_url),
      top_goals_player:players!top_goals_player_id(id, name, photo_url),
      top_assists_player:players!top_assists_player_id(id, name, photo_url)
    `)
    .eq('id', 1)
    .single()

  if (error || !data) return null
  return data as unknown as ClubStatusWithStats
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
