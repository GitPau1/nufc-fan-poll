'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import type { PlayerCommentItem } from '@/lib/queries/club'

type ActionResult = { success: true; comment: PlayerCommentItem } | { error: string }

export async function submitPlayerComment(
  playerId: string,
  content: string,
): Promise<ActionResult> {
  if (!content.trim()) return { error: 'empty' }

  if (IS_MOCK) {
    return {
      success: true,
      comment: {
        id: `mock-${Date.now()}`,
        player_id: playerId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: { display_name: 'Mock user', avatar_url: null },
      },
    }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('player_comments')
    .insert({ player_id: playerId, user_id: user.id, content: content.trim() })
    .select(`
      id, player_id, content, created_at,
      user:public_profiles!player_comments_public_profiles_user_id_fkey(display_name, avatar_url)
    `)
    .single()

  if (error) return { error: 'failed' }

  revalidatePath(`/players/${playerId}`)
  return {
    success: true,
    comment: {
      id: data.id,
      player_id: data.player_id,
      content: data.content,
      created_at: data.created_at,
      user: {
        display_name: data.user?.display_name ?? user.user_metadata?.name ?? user.email ?? null,
        avatar_url: data.user?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      },
    },
  }
}
