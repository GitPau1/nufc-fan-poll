'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'

type VoteResult =
  | { success: true }
  | { error: 'unauthenticated' | 'already_voted' | 'closed' | 'failed' }

export async function submitVote(pollId: string, optionId: string): Promise<VoteResult> {
  // 목 모드: 쿠키에 투표 항목 저장 → refresh 후 결과 화면으로 전환
  if (IS_MOCK) {
    const { cookies } = await import('next/headers')
    const jar = await cookies()
    jar.set(`mock-vote-${pollId}`, optionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
    revalidatePath(`/polls/${pollId}`)
    return { success: true }
  }

  const _optionId = optionId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('votes')
    .insert({ poll_id: pollId, user_id: user.id, option_id: _optionId })

  if (error) {
    // 23505 = unique violation (이미 투표한 사용자)
    if (error.code === '23505') return { error: 'already_voted' }
    return { error: 'failed' }
  }

  revalidatePath(`/polls/${pollId}`)
  return { success: true }
}
