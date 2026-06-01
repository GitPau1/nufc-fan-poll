import Link from 'next/link'
import { cookies } from 'next/headers'
import { AppHeader } from '@/components/layout/AppHeader'
import { PollListClient } from '@/components/polls/PollListClient'
import { IS_MOCK } from '@/lib/config'
import { getPollList } from '@/lib/queries/polls'

export default async function PollsPage() {
  const initialPolls = await getPollList(0)

  let isLoggedIn = false
  if (IS_MOCK) {
    const cookieStore = await cookies()
    isLoggedIn = cookieStore.get('mock-auth')?.value === 'true'
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = Boolean(user)
  }

  return (
    <>
      <AppHeader />
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
