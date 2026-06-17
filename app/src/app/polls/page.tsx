import { AppHeader } from '@/components/layout/AppHeader'
import { PollListClient } from '@/components/polls/PollListClient'
import { getPollList } from '@/lib/queries/polls'

export default async function PollsPage() {
  const initialPolls = await getPollList(0)

  return (
    <>
      <AppHeader showAuth={false} centerLogo />
      <main className="min-h-[calc(100vh-62px)] bg-[#f4f4f5] pb-24">
        <PollListClient initialPolls={initialPolls} />
      </main>
    </>
  )
}
