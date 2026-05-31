import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellBanner } from '@/components/home/FarewellBanner'
import { PollListClient } from '@/components/polls/PollListClient'
import { TransferListItem } from '@/components/transfers/TransferListItem'
import { getClubStatus } from '@/lib/queries/club'
import { getLatestFarewells } from '@/lib/queries/farewells'
import { getPollList } from '@/lib/queries/polls'
import { getSeasons, resolveSelectedSeason } from '@/lib/queries/seasons'
import { getLatestTransfersBySeasonId } from '@/lib/queries/transfers'

export default async function HomePage() {
  const [clubStatus, seasons] = await Promise.all([
    getClubStatus(),
    getSeasons(),
  ])
  const currentSeason = resolveSelectedSeason(seasons, null, clubStatus?.current_season_id)
  const [initialPolls, transferCards, farewells] = await Promise.all([
    getPollList(0),
    currentSeason ? getLatestTransfersBySeasonId(currentSeason.id, 5) : Promise.resolve([]),
    getLatestFarewells(3),
  ])

  return (
    <>
      <AppHeader />
      <main className="pb-24">
        {farewells.length > 0 && <FarewellBanner items={farewells} />}

        {transferCards.length > 0 && (
          <section className="px-4 pt-4 animate-enter">
            <div className="mb-2 flex items-center justify-between">
              <p className="px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                이적 소식
              </p>
              <Link href={currentSeason ? `/transfers?season=${encodeURIComponent(currentSeason.name)}` : '/transfers'} className="text-[12px] font-bold text-primary">
                더보기
              </Link>
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {transferCards.map(transfer => (
                <div key={transfer.id} className="w-[calc((100%-0.5rem)/2)] flex-none">
                  <TransferListItem transfer={transfer} />
                </div>
              ))}
            </div>
          </section>
        )}
        <PollListClient initialPolls={initialPolls} />
      </main>
    </>
  )
}
