import { AppHeader } from '@/components/layout/AppHeader'
import { PollListClient } from '@/components/polls/PollListClient'
import { PollCreateLink } from '@/components/polls/PollCreateLink'
import { getPollList } from '@/lib/queries/polls'

export default async function PollsPage() {
  const initialPolls = await getPollList(0)

  return (
    <>
      <AppHeader />
      <main className="pb-24">
        <PollListClient
          initialPolls={initialPolls}
          headerRight={<PollCreateLink />}
        />
      </main>
    </>
  )
}
