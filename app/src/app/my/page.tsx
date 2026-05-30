import { redirect } from 'next/navigation'
import { IS_MOCK } from '@/lib/config'
import { MOCK_PARTICIPATED } from '@/lib/mock/data'
import { MyPageClient } from '@/components/my/MyPageClient'

export default async function MyPage() {
  // ── 목 모드: 데모 프로필 ─────────────────────────────────────
  if (IS_MOCK) {
    return (
      <MyPageClient
        displayName="뉴캐슬 팬"
        email="fan@nufcvote.com"
        avatarUrl={null}
        participatedPolls={MOCK_PARTICIPATED}
        isMockMode={true}
      />
    )
  }

  // ── 실제 모드 ─────────────────────────────────────────────────
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // public.users.display_name 우선, 없으면 Google 이름 폴백
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email
    ?? '사용자'
  const email     = user.email ?? ''
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null

  const { data: voteRows } = await supabase
    .from('votes')
    .select(`
      created_at,
      option:poll_options(label),
      poll:polls(id, title, status)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  type ParticipatedVoteRow = {
    created_at: string
    option: { label: string } | null
    poll: { id: string; title: string; status: 'active' | 'closed' } | null
  }

  const participatedPolls = ((voteRows ?? []) as ParticipatedVoteRow[])
    .flatMap(row => {
      if (!row.poll) return []
      return [{
        pollId: row.poll.id,
        pollTitle: row.poll.title,
        optionLabel: row.option?.label ?? '',
        votedAt: row.created_at,
        pollStatus: row.poll.status,
      }]
    })

  return (
    <MyPageClient
      displayName={displayName}
      email={email}
      avatarUrl={avatarUrl}
      participatedPolls={participatedPolls}
      isMockMode={false}
    />
  )
}
