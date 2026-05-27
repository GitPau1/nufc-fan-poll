import { AppHeader } from '@/components/layout/AppHeader'
import { PollListClient } from '@/components/polls/PollListClient'
import { getPollList } from '@/lib/queries/polls'

export default async function HomePage() {
  const initialPolls = await getPollList(0)

  return (
    <>
      <AppHeader />
      <main>
        <PollListClient initialPolls={initialPolls} />
      </main>
    </>
  )
}
