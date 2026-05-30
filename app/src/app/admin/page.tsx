import { redirect } from 'next/navigation'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'
import { getPollList } from '@/lib/queries/polls'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage() {
  // Admin check
  if (IS_MOCK) {
    // In mock mode, any visitor can access admin if ADMIN_EMAILS is set.
    // This is intentional for local development only — never deploy with IS_MOCK=true.
    const adminEmails = process.env.ADMIN_EMAILS ?? ''
    if (!adminEmails) redirect('/')
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email || !isAdmin(user.email)) redirect('/')
  }

  // Admin email for display
  let adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim() ?? ''
  if (!IS_MOCK) {
    const { createClient: getClient } = await import('@/lib/supabase/server')
    const _s = await getClient()
    const { data: { user } } = await _s.auth.getUser()
    adminEmail = user?.email ?? adminEmail
  }

  // Fetch players and club status (real mode only)
  let players: Array<{
    id: string; name: string; position: string | null
    squad_number: number | null; is_active: boolean
    squad_status: 'first_team' | 'loan' | 'u21'
    nationality: string | null; birth_date: string | null; photo_url: string | null
    season_stats: Array<{ id: string; season: string; appearances: number; goals: number; assists: number }>
  }> = []
  let clubStatus: {
    league_rank: number | null; next_match_opponent: string | null
    next_match_date: string | null; next_match_venue: string | null
    top_appearances_player_id: string | null; top_appearances_count: number | null
    top_goals_player_id: string | null; top_goals_count: number | null
    top_assists_player_id: string | null; top_assists_count: number | null
  } | null = null
  let farewells: Array<{
    id: string; player_id: string; departure_type: string
    destination_club: string | null; departure_note: string | null; created_at: string
    player: { id: string; name: string; squad_number: number | null; photo_url: string | null } | null
  }> = []
  const polls = await getPollList()

  if (!IS_MOCK) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    type PlayerBase = Omit<(typeof players)[number], 'season_stats'>
    const [{ data: ps, error: playersError }, { data: cs }, { data: fs }] = await Promise.all([
      supabase
        .from('players')
        .select('id, name, position, squad_number, is_active, squad_status, nationality, birth_date, photo_url')
        .eq('is_active', true)
        .order('squad_number'),
      supabase.from('club_status').select('*').eq('id', 1).single(),
      serviceSupabase
        .from('farewells')
        .select('id, player_id, departure_type, destination_club, departure_note, created_at, player:players(id, name, squad_number, photo_url)')
        .order('created_at', { ascending: false }),
    ])
    let playerBaseRows = ((ps ?? []) as PlayerBase[]).map(player => ({
      ...player,
      squad_status: player.squad_status ?? 'first_team',
    }))
    if (playersError) {
      const fallback = await supabase
        .from('players')
        .select('id, name, position, squad_number, is_active, nationality, birth_date, photo_url')
        .eq('is_active', true)
        .order('squad_number')
      playerBaseRows = ((fallback.data as Omit<PlayerBase, 'squad_status'>[] | null) ?? [])
        .map(player => ({ ...player, squad_status: 'first_team' as const }))
    }

    const statsByPlayer = new Map<string, Array<{ id: string; season: string; appearances: number; goals: number; assists: number }>>()
    const { data: statsData } = await serviceSupabase
      .from('player_season_stats')
      .select('id, player_id, season, appearances, goals, assists')
      .in('player_id', playerBaseRows.map(player => player.id)) as unknown as {
        data: Array<{ id: string; player_id: string; season: string; appearances: number; goals: number; assists: number }> | null
      }

    for (const stat of statsData ?? []) {
      const rows = statsByPlayer.get(stat.player_id) ?? []
      rows.push({
        id: stat.id,
        season: stat.season,
        appearances: stat.appearances,
        goals: stat.goals,
        assists: stat.assists,
      })
      statsByPlayer.set(stat.player_id, rows)
    }

    players = playerBaseRows.map(player => ({
      ...player,
      season_stats: [...(statsByPlayer.get(player.id) ?? [])].sort((a, b) => b.season.localeCompare(a.season)),
    }))
    clubStatus = cs ?? null
    farewells = ((fs ?? []) as Array<{
      id: string; player_id: string; departure_type: string
      destination_club: string | null; departure_note: string | null; created_at: string
      player: { id: string; name: string; squad_number: number | null; photo_url: string | null } | { id: string; name: string; squad_number: number | null; photo_url: string | null }[] | null
    }>).map(farewell => ({
      ...farewell,
      player: Array.isArray(farewell.player) ? farewell.player[0] ?? null : farewell.player,
    }))
  }

  return <AdminDashboard adminEmail={adminEmail} players={players} polls={polls} clubStatus={clubStatus} farewells={farewells} />
}
