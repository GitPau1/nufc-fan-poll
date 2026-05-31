'use client'

import { useRouter } from 'next/navigation'
import type { SeasonOption } from '@/lib/queries/seasons'

export function TransferSeasonSelect({
  seasons,
  selectedSeasonName,
}: {
  seasons: SeasonOption[]
  selectedSeasonName: string
}) {
  const router = useRouter()

  return (
    <select
      value={selectedSeasonName}
      onChange={event => router.push(`/transfers?season=${encodeURIComponent(event.target.value)}`)}
      className="input-field"
    >
      {seasons.map(season => (
        <option key={season.id} value={season.name}>
          {season.name}
        </option>
      ))}
    </select>
  )
}
