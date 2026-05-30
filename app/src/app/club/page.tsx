import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import ClubStatusCard from '@/components/club/ClubStatusCard'
import SeasonStats from '@/components/club/SeasonStats'
import SquadList from '@/components/club/SquadList'
import { getClubStatus, getSquad } from '@/lib/queries/club'

export default async function ClubPage() {
  const [status, players] = await Promise.all([
    getClubStatus(),
    getSquad(),
  ])

  return (
    <>
      <AppHeader />
      <main className="pb-24">
        <div className="px-4 pt-4">
          <ClubStatusCard status={status} />
          <SeasonStats status={status} />
          <div className="flex justify-between mb-3">
            <h2 className="text-[16px] font-extrabold text-foreground tracking-tight">
              스쿼드
            </h2>
            <div className="flex items-center gap-3">
              <Link href="/transfers" className="text-[12px] font-bold text-primary">
                이적
              </Link>
              <span className="text-[12px] text-muted-foreground">{players.length}명</span>
            </div>
          </div>
          <SquadList players={players} />
        </div>
      </main>
    </>
  )
}
