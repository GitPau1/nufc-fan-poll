import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlayerRatingChangesAnalytics } from '@/components/players/PlayerRatingChangesAnalytics'
import { getLatestPickOneRatingChanges } from '@/lib/queries/player-pick-one'

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  return String(delta)
}

export default async function PlayerRatingChangesPage() {
  const week = await getLatestPickOneRatingChanges()

  return (
    <>
      <PlayerRatingChangesAnalytics
        hasAppliedWeek={Boolean(week)}
        changedPlayerCount={week?.changes.length ?? 0}
      />
      <AppHeader showAuth={false} />
      <main className="min-h-[calc(100vh-62px)] bg-[#f4f4f5] px-4 pb-24 pt-4">
        <div className="mb-3">
          <Link href="/players" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            역대 선수
          </Link>
        </div>

        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-4">
            <h1 className="text-[18px] font-bold leading-6 text-foreground">이번주 변경 내역</h1>
            <p className="mt-1 text-[12px] leading-[16.5px] text-muted-foreground">
              {week
                ? `${formatDate(week.weekStartAt)} - ${formatDate(week.weekEndAt)} 반영 결과`
                : '아직 공개된 변경 내역이 없습니다'}
            </p>
          </div>

          {week && week.changes.length > 0 ? (
            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_54px_54px_44px] border-b border-border px-4 py-3 text-[11px] font-medium tracking-[0.8px] text-gray-3">
                <span>선수</span>
                <span className="text-center">이전 오버롤</span>
                <span className="text-center">이후 오버롤</span>
                <span className="text-right">변화</span>
              </div>
              <div className="divide-y divide-border">
                {week.changes.map(change => (
                  <div
                    key={change.playerId}
                    className="grid min-h-[70px] grid-cols-[minmax(0,1fr)_54px_54px_44px] items-center gap-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold leading-5 text-foreground">
                        {change.playerName}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-[16.5px] text-muted-foreground">
                        {change.position} · {change.wins}승 {change.losses}패
                      </p>
                    </div>
                    <span className="text-center text-[14px] font-semibold text-gray-2">
                      {change.previousOverall}
                    </span>
                    <span className="text-center text-[14px] font-semibold text-foreground">
                      {change.newOverall}
                    </span>
                    <span className={`text-right text-[14px] font-bold ${change.delta > 0 ? 'text-positive' : change.delta < 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                      {formatDelta(change.delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center">
              <p className="text-sm font-semibold text-foreground">아직 공개된 변경 내역이 없습니다</p>
              <p className="text-xs leading-[18px] text-muted-foreground">
                매주 일요일 00:00에 지난 한 주의 선택이 반영됩니다.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
