import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellCard } from '@/components/farewells/FarewellCard'
import { getLatestFarewells } from '@/lib/queries/farewells'

interface TransfersPageProps {
  searchParams?: Promise<{ season?: string }>
}

function seasonFromDate(date: string | null): string | null {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  return `${year - 1}-${String(year).slice(2)}`
}

function isSeason(value: string | null): value is string {
  return value !== null
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams
  const selectedSeason = params?.season ?? 'all'
  const transfers = await getLatestFarewells(50)
  const seasons = Array.from(
    new Set(transfers.map(transfer => seasonFromDate(transfer.left_at ?? transfer.created_at)).filter(isSeason)),
  ).sort((a, b) => b.localeCompare(a))
  const filteredTransfers = selectedSeason === 'all'
    ? transfers
    : transfers.filter(transfer => seasonFromDate(transfer.left_at ?? transfer.created_at) === selectedSeason)

  return (
    <>
      <AppHeader />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <div className="mb-3">
          <h1 className="text-[20px] font-black text-foreground tracking-tight">이적</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            영입, 임대, 승격, 이적, 방출 소식을 모아봅니다.
          </p>
        </div>

        {seasons.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/transfers"
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                selectedSeason === 'all'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-muted-foreground'
              }`}
            >
              전체
            </Link>
            {seasons.map(season => (
              <Link
                key={season}
                href={`/transfers?season=${encodeURIComponent(season)}`}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-bold ${
                  selectedSeason === season
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-muted-foreground'
                }`}
              >
                {season}
              </Link>
            ))}
          </div>
        )}

        {filteredTransfers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center">
            <p className="text-[13px] font-semibold text-foreground">등록된 이적 소식이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredTransfers.map(transfer => (
              <FarewellCard key={transfer.id} farewell={transfer} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
