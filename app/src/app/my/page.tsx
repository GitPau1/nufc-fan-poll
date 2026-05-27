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

  // TODO: 실제 DB에서 참여한 투표 목록 조회
  const displayName = (user.user_metadata?.name as string | undefined) ?? user.email ?? '사용자'
  const email       = user.email ?? ''
  const avatarUrl   = (user.user_metadata?.avatar_url as string | undefined) ?? null

  return (
    <MyPageClient
      displayName={displayName}
      email={email}
      avatarUrl={avatarUrl}
      participatedPolls={[]}   // TODO: 실제 쿼리
      isMockMode={false}
    />
  )
}
