import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/config'
import type { DepartureType, PlayerRow } from '@/types/database'

export type PlayerSeasonStatItem = {
  id: string
  player_id: string
  season: string
  season_id?: string | null
  appearances: number
  goals: number
  assists: number
}

export type FarewellItem = {
  id: string
  player_id: string
  departure_type: DepartureType
  destination_club: string | null
  departure_note: string | null
  banner_image_url: string | null
  appearances: number | null
  goals: number | null
  assists: number | null
  clean_sheets: number | null
  joined_at: string | null
  left_at: string | null
  is_published: boolean
  created_at: string
  player: PlayerRow | null
  comment_count: number
  season_stats?: PlayerSeasonStatItem[]
}

export type FarewellCommentItem = {
  id: string
  farewell_id: string
  content: string
  created_at: string
  user: { display_name: string | null; avatar_url: string | null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

const PUBLIC_STORY_TYPES: DepartureType[] = [
  'signing',
  'loan_in',
  'promotion',
  'loan_return',
  'transferred',
  'contract_expired',
  'released',
]

function isMissingColumnError(error: AnyRow): boolean {
  const message = String(error?.message ?? '')
  return message.includes('column') && message.includes('does not exist')
}

function isMissingRelationError(error: AnyRow): boolean {
  const message = String(error?.message ?? '')
  return message.includes('schema cache') || message.includes('does not exist')
}

function normalizePlayer(player: AnyRow): PlayerRow | null {
  if (!player) return null
  return {
    ...player,
    squad_status: player.squad_status ?? 'first_team',
  } as PlayerRow
}

const mockPlayer: PlayerRow = {
  id: 'p-wilson',
  name: 'Callum Wilson',
  position: 'FWD',
  squad_number: 9,
  photo_url: null,
  is_active: false,
  squad_status: 'first_team',
  nationality: 'England',
  birth_date: '1992-02-27',
}

const MOCK_FAREWELL: FarewellItem = {
  id: 'farewell-wilson',
  player_id: mockPlayer.id,
  departure_type: 'released',
  destination_club: null,
  departure_note: 'Thanks for every important goal in black and white.',
  banner_image_url: null,
  appearances: 130,
  goals: 49,
  assists: 11,
  clean_sheets: null,
  joined_at: '2020-09-07',
  left_at: '2026-05-29',
  is_published: true,
  created_at: new Date(Date.now() - 3600_000).toISOString(),
  player: mockPlayer,
  comment_count: 2,
}

export async function getLatestFarewells(limit = 3): Promise<FarewellItem[]> {
  if (IS_MOCK) return [MOCK_FAREWELL].slice(0, limit)

  const supabase = await createClient()
  let { data, error } = await supabase
    .from('farewells')
    .select(`
      id, player_id, departure_type, destination_club, departure_note, banner_image_url,
      appearances, goals, assists, clean_sheets, joined_at, left_at,
      is_published, created_at,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status, nationality, birth_date),
      comment_count:farewell_comments(count)
    `)
    .eq('is_published', true)
    .in('departure_type', PUBLIC_STORY_TYPES)
    .order('created_at', { ascending: false })
    .limit(limit) as { data: AnyRow[] | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('farewells')
      .select(`
        id, player_id, departure_type, destination_club, departure_note,
        appearances, goals, assists, clean_sheets, joined_at, left_at,
        is_published, created_at,
        player:players(id, name, position, squad_number, photo_url, is_active, nationality, birth_date),
        comment_count:farewell_comments(count)
      `)
      .eq('is_published', true)
      .in('departure_type', PUBLIC_STORY_TYPES)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: AnyRow[] | null; error: AnyRow }

    data = fallback.data
    error = fallback.error
  }

  if (error || !data) return []
  return data.map(mapFarewellRow)
}

export async function getFarewellById(id: string): Promise<FarewellItem | null> {
  if (IS_MOCK) return id === MOCK_FAREWELL.id ? MOCK_FAREWELL : null

  const supabase = await createClient()
  let { data, error } = await supabase
    .from('farewells')
    .select(`
      id, player_id, departure_type, destination_club, departure_note, banner_image_url,
      appearances, goals, assists, clean_sheets, joined_at, left_at,
      is_published, created_at,
      player:players(id, name, position, squad_number, photo_url, is_active, squad_status, nationality, birth_date),
      comment_count:farewell_comments(count)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single() as { data: AnyRow | null; error: AnyRow }

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('farewells')
      .select(`
        id, player_id, departure_type, destination_club, departure_note,
        appearances, goals, assists, clean_sheets, joined_at, left_at,
        is_published, created_at,
        player:players(id, name, position, squad_number, photo_url, is_active, nationality, birth_date),
        comment_count:farewell_comments(count)
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single() as { data: AnyRow | null; error: AnyRow }

    data = fallback.data
    error = fallback.error
  }

  if (error || !data) return null
  return mapFarewellRow(data)
}

export async function getFarewellComments(farewellId: string): Promise<FarewellCommentItem[]> {
  if (IS_MOCK) {
    return [
      {
        id: 'fc1',
        farewell_id: farewellId,
        content: 'Thank you for the memories. That Spurs hat trick will stay with me.',
        created_at: new Date(Date.now() - 1800_000).toISOString(),
        user: { display_name: 'ToonArmy88', avatar_url: null },
      },
      {
        id: 'fc2',
        farewell_id: farewellId,
        content: 'Proper number nine. Wishing you the best for what comes next.',
        created_at: new Date(Date.now() - 7200_000).toISOString(),
        user: { display_name: 'NUFC2030', avatar_url: null },
      },
    ]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('farewell_comments')
    .select(`
      id, farewell_id, content, created_at,
      user:public_profiles!farewell_comments_public_profiles_user_id_fkey(display_name, avatar_url)
    `)
    .eq('farewell_id', farewellId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50) as { data: AnyRow[] | null; error: AnyRow }

  if ((error && isMissingRelationError(error)) || !data) return []
  if (error) return []
  return data.map(row => ({
    id: row.id,
    farewell_id: row.farewell_id,
    content: row.content,
    created_at: row.created_at,
    user: {
      display_name: row.user?.display_name ?? null,
      avatar_url: row.user?.avatar_url ?? null,
    },
  }))
}

export async function getPlayerSeasonStats(playerId: string): Promise<PlayerSeasonStatItem[]> {
  if (IS_MOCK) {
    return [
      { id: 'ps-2020', player_id: playerId, season: '2020-21', appearances: 26, goals: 12, assists: 5 },
      { id: 'ps-2021', player_id: playerId, season: '2021-22', appearances: 18, goals: 8, assists: 0 },
      { id: 'ps-2022', player_id: playerId, season: '2022-23', appearances: 31, goals: 18, assists: 5 },
    ]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('player_season_stats')
    .select('id, player_id, season, appearances, goals, assists')
    .eq('player_id', playerId)
    .order('season', { ascending: false }) as { data: AnyRow[] | null; error: AnyRow }

  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    player_id: row.player_id,
    season: row.season,
    appearances: row.appearances,
    goals: row.goals,
    assists: row.assists,
  }))
}

function mapFarewellRow(row: AnyRow): FarewellItem {
  return {
    id: row.id,
    player_id: row.player_id,
    departure_type: row.departure_type,
    destination_club: row.destination_club,
    departure_note: row.departure_note,
    banner_image_url: row.banner_image_url ?? null,
    appearances: row.appearances,
    goals: row.goals,
    assists: row.assists,
    clean_sheets: row.clean_sheets,
    joined_at: row.joined_at,
    left_at: row.left_at,
    is_published: row.is_published,
    created_at: row.created_at,
    player: normalizePlayer(row.player),
    comment_count: row.comment_count?.[0]?.count ?? 0,
  }
}
