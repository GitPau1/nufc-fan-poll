import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellCard } from '@/components/farewells/FarewellCard'
import { PollListClient } from '@/components/polls/PollListClient'
import { getLatestFarewells } from '@/lib/queries/farewells'
import { getPollList } from '@/lib/queries/polls'

export default async function HomePage() {
  const [initialPolls, farewells] = await Promise.all([
    getPollList(0),
    getLatestFarewells(6),
  ])
  const transferCards = farewells.slice(0, 5)

  return (
    <>
      <AppHeader />
      <main>
        {farewells.length > 0 && (
          <section className="px-4 pt-4 animate-enter">
            <div className="mb-2 flex items-center justify-between">
              <p className="px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                이적 소식
              </p>
              <Link href="/transfers" className="text-[12px] font-bold text-primary">
                더보기
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {transferCards.map(farewell => (
                <div key={farewell.id} className="min-w-[220px] max-w-[320px] flex-[1_1_220px]">
                  <FarewellCard farewell={farewell} />
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
