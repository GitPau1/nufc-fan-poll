import Link from 'next/link'
import { History } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import ClubStatusCard from '@/components/club/ClubStatusCard'
import SeasonStats from '@/components/club/SeasonStats'
import SquadList from '@/components/club/SquadList'
import { getClubStatus, getSquad } from '@/lib/queries/club'

export const revalidate = 60

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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-foreground tracking-tight">
              스쿼드
            </h2>
            <Link
              href="/transfers"
              className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-[12px] font-black text-primary-dark transition-opacity hover:opacity-70 active:opacity-50"
            >
              <History className="h-3.5 w-3.5" />
              역사
            </Link>
          </div>
          <SquadList players={players} />
        </div>
      </main>
    </>
  )
}
