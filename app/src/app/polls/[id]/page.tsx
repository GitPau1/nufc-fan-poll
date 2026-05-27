import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPollById, getVoteCounts, getMyVote } from '@/lib/queries/polls'
import { getComments } from '@/lib/queries/comments'
import { TypeAPollClient } from '@/components/polls/TypeAPollClient'
import { TypeBPollClient } from '@/components/polls/TypeBPollClient'
import { ResultView } from '@/components/polls/ResultView'
import { IS_MOCK } from '@/lib/config'

interface PollPageProps {
  params: Promise<{ id: string }>
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params

  let user = null
  if (IS_MOCK) {
    const cookieStore = await cookies()
    if (cookieStore.get('mock-auth')?.value === 'true') {
      user = { id: 'mock-user', user_metadata: { name: '뉴캐슬 팬', avatar_url: null } }
    }
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  const poll = await getPollById(id)
  if (!poll) notFound()

  const isClosed = poll.status === 'closed'

  // 내 투표 여부 확인
  // mock 모드: 로그인 여부와 무관하게 쿠키 확인 (투표 후 로그아웃해도 결과 유지)
  const myOptionId = IS_MOCK
    ? await getMyVote(id, 'mock-user')
    : user ? await getMyVote(id, user.id) : null
  const hasVoted = !!myOptionId

  // 결과 표시 조건: 마감됐거나 이미 투표함
  const showResult = isClosed || hasVoted

  if (showResult) {
    const [voteCounts, comments] = await Promise.all([
      getVoteCounts(id),
      getComments(id, user?.id ?? null),
    ])
    return (
      <ResultView
        poll={poll}
        voteCounts={voteCounts}
        myOptionId={myOptionId}
        comments={comments}
      />
    )
  }

  // 아직 투표 전
  if (poll.type === 'selection') {
    return <TypeBPollClient poll={poll} isAuthenticated={!!user} />
  }

  return <TypeAPollClient poll={poll} isAuthenticated={!!user} />
}
