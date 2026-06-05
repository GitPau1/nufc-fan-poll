import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { PollListClient } from '@/components/polls/PollListClient'
import { getHeaderAuth } from '@/lib/actions/auth'
import { getPollList } from '@/lib/queries/polls'

export default async function PollsPage() {
  const [initialPolls, auth] = await Promise.all([
    getPollList(0),
    getHeaderAuth(),
  ])
  const isLoggedIn = Boolean(auth)

  return (
    <>
      <AppHeader auth={auth} />
      <main className="pb-24">
        <PollListClient
          initialPolls={initialPolls}
          headerRight={isLoggedIn ? (
            <Link href="/polls/create" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-[12px] font-bold text-primary-foreground">
              투표 만들기
            </Link>
          ) : null}
        />
      </main>
    </>
  )
}
