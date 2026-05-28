import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellCard } from '@/components/farewells/FarewellCard'
import { PollListClient } from '@/components/polls/PollListClient'
import { getLatestFarewells } from '@/lib/queries/farewells'
import { getPollList } from '@/lib/queries/polls'

export default async function HomePage() {
  const [initialPolls, farewells] = await Promise.all([
    getPollList(0),
    getLatestFarewells(2),
  ])

  return (
    <>
      <AppHeader />
      <main>
        {farewells.length > 0 && (
          <section className="px-4 pt-4 flex flex-col gap-2 animate-enter">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
              작별
            </p>
            {farewells.map(farewell => (
              <FarewellCard key={farewell.id} farewell={farewell} />
            ))}
          </section>
        )}
        <PollListClient initialPolls={initialPolls} />
      </main>
    </>
  )
}
