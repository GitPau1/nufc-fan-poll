import { AppHeader } from '@/components/layout/AppHeader'
import { TransferListItem } from '@/components/transfers/TransferListItem'
import { getClubStatus } from '@/lib/queries/club'
import { getTransfersBySeason } from '@/lib/queries/transfers'

export default async function TransfersPage() {
  const clubStatus = await getClubStatus()
  const currentSeason = clubStatus?.current_season?.trim() ?? null
  const transfers = currentSeason ? await getTransfersBySeason(currentSeason) : []

  return (
    <>
      <AppHeader />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <div className="mb-3">
          <h1 className="text-[20px] font-black text-foreground tracking-tight">이적</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            현재 시즌 In/Out 이력만 간단히 모아봅니다.
          </p>
        </div>

        {currentSeason ? (
          <div className="mb-3 rounded-2xl border border-border bg-white px-4 py-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-primary">Current Season</p>
            <p className="mt-1 text-[14px] font-black text-foreground">{currentSeason}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center">
            <p className="text-[13px] font-semibold text-foreground">현재 시즌이 아직 설정되지 않았어요.</p>
            <p className="mt-1 text-[12px] text-muted-foreground">관리자에서 현재 시즌을 입력하면 이적 탭이 열립니다.</p>
          </div>
        )}

        {currentSeason && (
          transfers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center">
              <p className="text-[13px] font-semibold text-foreground">이번 시즌 이적 이력이 없어요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transfers.map(transfer => (
                <TransferListItem key={transfer.id} transfer={transfer} />
              ))}
            </div>
          )
        )}
      </main>
    </>
  )
}
