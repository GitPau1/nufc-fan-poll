import Link from 'next/link'
import type { FarewellItem } from '@/lib/queries/farewells'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TRANSFER_LABEL: Record<FarewellItem['departure_type'], string> = {
  signing: '영입',
  loan_in: '임대',
  promotion: '승격',
  loan_return: '임대 복귀',
  transferred: '이적',
  contract_expired: '계약 만료',
  loan_out: '임대',
  released: '방출',
}

function isIncoming(type: FarewellItem['departure_type']): boolean {
  return type === 'signing' || type === 'loan_in' || type === 'loan_return' || type === 'promotion'
}

function thumbnail(farewell: FarewellItem): string {
  if (farewell.player?.photo_url) return farewell.player.photo_url
  const text = farewell.player?.name.slice(0, 2) ?? 'TR'
  return `https://placehold.co/96x96/0c2340/41b6e6?text=${encodeURIComponent(text)}`
}

function formatYear(date: string | null): string {
  if (!date) return '-'
  const year = new Date(date).getFullYear()
  return Number.isNaN(year) ? '-' : String(year)
}

export function FarewellCard({ farewell }: { farewell: FarewellItem }) {
  const player = farewell.player
  const period = `${formatYear(farewell.joined_at)} - ${formatYear(farewell.left_at)}`
  const incoming = isIncoming(farewell.departure_type)

  return (
    <Link href={`/farewells/${farewell.id}`} className="block h-full active:scale-[0.98] transition-transform duration-100">
      <Card className={`h-full min-w-[220px] rounded-2xl hover:shadow-sm transition-shadow duration-200 cursor-pointer ${
        incoming
          ? 'border-emerald-200 bg-emerald-50/80'
          : 'border-sky-200 bg-sky-50/80'
      }`}>
        <div className="flex gap-3 p-3 items-center">
          <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/70">
            <img src={thumbnail(farewell)} alt={player?.name ?? 'Transfer player'} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge className={`text-[10px] font-semibold border-0 pointer-events-none ${
                incoming
                  ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                  : 'bg-sky-600 text-white hover:bg-sky-600'
              }`}>
                {TRANSFER_LABEL[farewell.departure_type]}
              </Badge>
              <span className="min-w-0 truncate text-[11px] font-semibold text-muted-foreground">
                to {farewell.destination_club || '미정'}
              </span>
            </div>
            <p className="text-[14px] font-bold text-foreground leading-snug truncate">
              {player?.name ?? 'Transfer player'}
            </p>
            <p className="text-[12px] text-muted-foreground leading-snug truncate mt-0.5">
              {period}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
