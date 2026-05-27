import { redirect } from 'next/navigation'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'
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
  }> = []
  let clubStatus: {
    league_rank: number | null; next_match_opponent: string | null
    next_match_date: string | null; next_match_venue: string | null
    top_appearances_player_id: string | null; top_appearances_count: number | null
    top_goals_player_id: string | null; top_goals_count: number | null
    top_assists_player_id: string | null; top_assists_count: number | null
  } | null = null

  if (!IS_MOCK) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase.from('players').select('id, name, position, squad_number, is_active').order('squad_number'),
      supabase.from('club_status').select('*').eq('id', 1).single(),
    ])
    players = ps ?? []
    clubStatus = cs ?? null
  }

  return <AdminDashboard adminEmail={adminEmail} players={players} clubStatus={clubStatus} />
}
