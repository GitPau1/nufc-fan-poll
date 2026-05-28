import Link from 'next/link'
import type { FarewellItem } from '@/lib/queries/farewells'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DEPARTURE_LABEL: Record<FarewellItem['departure_type'], string> = {
  released: '방출',
  transferred: '이적',
  loan_end: '임대 종료',
  retired: '은퇴',
}

function thumbnail(farewell: FarewellItem): string {
  if (farewell.player?.photo_url) return farewell.player.photo_url
  const text = farewell.player?.name.slice(0, 2) ?? 'FW'
  return `https://placehold.co/96x96/0c2340/41b6e6?text=${encodeURIComponent(text)}`
}

function formatYear(date: string | null): string {
  if (!date) return '-'
  return String(new Date(date).getFullYear())
}

export function FarewellCard({ farewell }: { farewell: FarewellItem }) {
  const player = farewell.player
  const period = `${formatYear(farewell.joined_at)} - ${formatYear(farewell.left_at)}`

  return (
    <Link href={`/farewells/${farewell.id}`} className="block active:scale-[0.98] transition-transform duration-100">
      <Card className="rounded-2xl border-primary/15 bg-white hover:shadow-sm transition-shadow duration-200 cursor-pointer">
        <div className="flex gap-3 p-3 items-center">
          <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
            <img src={thumbnail(farewell)} alt={player?.name ?? 'Farewell'} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-0 pointer-events-none hover:bg-primary/10">
                작별
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-semibold pointer-events-none">
                {DEPARTURE_LABEL[farewell.departure_type]}
              </Badge>
            </div>
            <p className="text-[14px] font-bold text-foreground leading-snug truncate">
              {player?.name ?? 'Departing player'}
            </p>
            <p className="text-[12px] text-muted-foreground leading-snug truncate mt-0.5">
              {farewell.destination_club ? `→ ${farewell.destination_club}` : '행선지 미정'} · {period}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
