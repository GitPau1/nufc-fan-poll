import { AppHeader } from '@/components/layout/AppHeader'
import { TransferListItem } from '@/components/transfers/TransferListItem'
import { TransferSeasonSelect } from '@/components/transfers/TransferSeasonSelect'
import { getClubStatus } from '@/lib/queries/club'
import { getSeasons, resolveSelectedSeason } from '@/lib/queries/seasons'
import { getTransfersBySeasonId } from '@/lib/queries/transfers'
import { splitTransfersByMovementGroup } from '@/lib/transfers/group'

export const revalidate = 60

const TRANSFER_SECTIONS: Array<{ key: 'permanent' | 'loan'; title: string }> = [
  { key: 'permanent', title: '영구 이적' },
  { key: 'loan', title: '임대' },
]

export default async function TransfersPage({
  searchParams,
}: {
  searchParams?: { season?: string }
}) {
  const [clubStatus, seasons] = await Promise.all([
    getClubStatus(),
    getSeasons(),
  ])
  const selectedSeason = resolveSelectedSeason(seasons, searchParams?.season, clubStatus?.current_season_id)
  const transfers = selectedSeason ? await getTransfersBySeasonId(selectedSeason.id) : []
  const groupedTransfers = splitTransfersByMovementGroup(transfers)

  return (
    <>
      <AppHeader />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <div className="mb-3">
          <h1 className="text-[20px] font-black text-foreground tracking-tight">이적</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            시즌별 In/Out 이력을 간단히 모아봅니다.
          </p>
        </div>

        {selectedSeason ? (
          <div className="mb-3 rounded-2xl border border-border bg-white px-4 py-3">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-primary">Season</p>
            <TransferSeasonSelect seasons={seasons} selectedSeasonName={selectedSeason.name} />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center">
            <p className="text-[13px] font-semibold text-foreground">등록된 시즌이 아직 없어요.</p>
            <p className="mt-1 text-[12px] text-muted-foreground">관리자에서 현재 시즌을 설정하면 이적 탭이 열립니다.</p>
          </div>
        )}

        {selectedSeason && (
          transfers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center">
              <p className="text-[13px] font-semibold text-foreground">이번 시즌 이적 이력이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {TRANSFER_SECTIONS.map(section => {
                const items = groupedTransfers[section.key]

                return (
                  <section key={section.key} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[14px] font-black text-foreground">{section.title}</h2>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{items.length}건</p>
                    </div>
                    {items.length === 0 ? (
                      <div className="rounded-2xl border border-border bg-white px-4 py-6 text-center">
                        <p className="text-[13px] text-muted-foreground">등록된 이적이 없어요.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {items.map(transfer => (
                          <TransferListItem key={transfer.id} transfer={transfer} />
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )
        )}
      </main>
    </>
  )
}
