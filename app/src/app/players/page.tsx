import { AppHeader } from '@/components/layout/AppHeader'
import { PlayersPageClient, type PlayerListItem } from '@/components/players/PlayersPageClient'
import { IS_MOCK } from '@/lib/config'
import { MOCK_PLAYERS } from '@/lib/mock/data'
import type { PlayerRow } from '@/types/database'

export const revalidate = 60

type PlayerWithRating = PlayerRow & {
  base_rating: number
}

function toPlayerListItem(player: PlayerWithRating, index: number): PlayerListItem {
  const squadLabel = player.squad_status === 'first_team'
    ? '현 소속'
    : player.squad_status === 'loan'
      ? '임대'
      : 'U21'

  return {
    id: player.id,
    name: player.name,
    position: player.position,
    meta: player.squad_number ? `#${player.squad_number} · ${squadLabel}` : squadLabel,
    rank: index + 1,
    overall: player.base_rating,
    photoUrl: player.photo_url,
  }
}

async function getPlayers(): Promise<PlayerListItem[]> {
  if (IS_MOCK) {
    return MOCK_PLAYERS
      .map((player, index) => ({ ...player, base_rating: 90 - index }))
      .map(toPlayerListItem)
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('players')
    .select('id, name, position, squad_number, photo_url, base_rating, is_active, squad_status')
    .order('is_active', { ascending: false })
    .order('base_rating', { ascending: false })
    .order('name', { ascending: true })

  return ((data ?? []) as PlayerWithRating[]).map(toPlayerListItem)
}

export default async function PlayersPage() {
  const players = await getPlayers()

  return (
    <>
      <AppHeader showAuth={false} />
      <main className="pb-24">
        <PlayersPageClient players={players} />
      </main>
    </>
  )
}
