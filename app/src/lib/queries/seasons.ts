import { IS_MOCK } from '@/lib/config'
import type { SeasonRow } from '@/types/database'

export type SeasonOption = Pick<SeasonRow, 'id' | 'name' | 'is_current' | 'display_order'>

const MOCK_SEASONS: SeasonOption[] = [
  { id: 'season-2025', name: '2025-26', is_current: true, display_order: 2025 },
  { id: 'season-2024', name: '2024-25', is_current: false, display_order: 2024 },
]

export async function getSeasons(): Promise<SeasonOption[]> {
  if (IS_MOCK) return MOCK_SEASONS

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('seasons')
    .select('id, name, is_current, display_order')
    .order('display_order', { ascending: false })
    .order('name', { ascending: false })

  if (error || !data) return []
  return data as SeasonOption[]
}

export function resolveSelectedSeason(
  seasons: SeasonOption[],
  requestedName: string | null | undefined,
  currentSeasonId: string | null | undefined,
): SeasonOption | null {
  const requested = requestedName ? seasons.find(season => season.name === requestedName) : null
  if (requested) return requested
  return seasons.find(season => season.id === currentSeasonId) ?? seasons.find(season => season.is_current) ?? seasons[0] ?? null
}
