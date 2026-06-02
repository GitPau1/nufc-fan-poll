'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import { normalizeFeedbackContent } from '@/lib/feedback'

type ActionResult = { success: true } | { error: string }

export async function submitFeedback(content: string): Promise<ActionResult> {
  const normalized = normalizeFeedbackContent(content)
  if ('error' in normalized) return { error: normalized.error }

  if (IS_MOCK) {
    revalidatePath('/my')
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_feedback')
    .insert({ user_id: user.id, content: normalized.content })

  if (error) {
    console.error('submitFeedback error:', error)
    return { error: '피드백 저장에 실패했어요. 다시 시도해주세요.' }
  }

  revalidatePath('/my')
  return { success: true }
}
