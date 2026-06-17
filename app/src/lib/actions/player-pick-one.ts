'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import { getKstWeekStart } from '@/lib/players/pick-one-rating'

type PickOneChoiceResult =
  | { success: true }
  | { duplicate: true }
  | { error: 'unauthenticated' | 'invalid' | 'not_found' | 'failed' }

function sortPair(leftId: string, rightId: string): [string, string] {
  return leftId < rightId ? [leftId, rightId] : [rightId, leftId]
}

export async function submitPickOneChoice(
  winnerPlayerId: string,
  loserPlayerId: string,
): Promise<PickOneChoiceResult> {
  if (winnerPlayerId === loserPlayerId) return { error: 'invalid' }

  if (IS_MOCK) {
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: players } = await serviceSupabase
    .from('players')
    .select('id, is_active')
    .in('id', [winnerPlayerId, loserPlayerId])

  if (!players || players.length !== 2 || players.some(player => !player.is_active)) {
    return { error: 'not_found' }
  }

  const [playerAId, playerBId] = sortPair(winnerPlayerId, loserPlayerId)
  const { error } = await serviceSupabase
    .from('player_pick_one_choices')
    .insert({
      user_id: user.id,
      winner_player_id: winnerPlayerId,
      loser_player_id: loserPlayerId,
      player_a_id: playerAId,
      player_b_id: playerBId,
      week_start_at: getKstWeekStart().toISOString(),
    })

  if (error) {
    if (error.code === '23505') return { duplicate: true }
    return { error: 'failed' }
  }

  revalidatePath('/players')
  return { success: true }
}
