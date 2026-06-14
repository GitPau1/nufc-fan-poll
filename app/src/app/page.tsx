import { AppHeader } from '@/components/layout/AppHeader'
import { PollFeedAnalytics } from '@/components/analytics/AppAnalytics'
import { PollCard } from '@/components/polls/PollCard'
import { getHeaderAuth } from '@/lib/actions/auth'
import { getPollList } from '@/lib/queries/polls'

export const revalidate = 60

export default async function HomePage() {
  const [auth, recentPolls] = await Promise.all([
    getHeaderAuth(),
    getPollList(0),
  ])
  const closingSoonPoll = recentPolls
    .filter(poll => poll.status === 'active')
    .sort((a, b) => new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime())[0] ?? null
  const latestPolls = recentPolls
    .filter(poll => poll.id !== closingSoonPoll?.id)
    .slice(0, 3)

  return (
    <>
      <AppHeader auth={auth} />
      <main className="pb-24">
        {closingSoonPoll && (
          <section className="px-4 pt-5 animate-enter">
            <PollFeedAnalytics sourcePage="home" pollCount={recentPolls.length} />
            <div className="mb-2 flex items-center justify-between px-0.5">
              <p className="px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                곧 마감되는 투표
              </p>
            </div>
            <PollCard poll={closingSoonPoll} />
          </section>
        )}

        {latestPolls.length > 0 && (
          <section className="px-4 pt-5 animate-enter">
            <div className="mb-2 flex items-center justify-between px-0.5">
              <p className="px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                최근 올라온 투표
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {latestPolls.map(poll => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
