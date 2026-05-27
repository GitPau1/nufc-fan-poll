'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'

type ActionResult = { success: true } | { error: string }

export async function submitComment(
  pollId: string,
  content: string,
): Promise<ActionResult> {
  if (!content.trim()) return { error: 'empty' }

  // 목 모드: 성공 반환 (클라이언트에서 낙관적 업데이트)
  if (IS_MOCK) {
    revalidatePath(`/polls/${pollId}`)
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('comments')
    .insert({ poll_id: pollId, user_id: user.id, content: content.trim() })

  if (error) return { error: 'failed' }

  revalidatePath(`/polls/${pollId}`)
  return { success: true }
}

export async function toggleLike(
  commentId: string,
  pollId: string,
): Promise<ActionResult> {
  if (IS_MOCK) return { success: true }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('comment_likes').delete().eq('id', existing.id)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
  }

  revalidatePath(`/polls/${pollId}`)
  return { success: true }
}
