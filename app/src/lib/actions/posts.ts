'use server'

import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import { getReactionToggleOperation, isReactionType, normalizePostInput } from '@/lib/posts'
import type { AnySupabase } from '@/lib/supabase/admin'
import type { PostReactionType } from '@/types/database'

type ActionResult = { success: true } | { error: string }

export type PostViewerState = {
  isLoggedIn: boolean
  myPostIds: string[]
  myReactions: Partial<Record<string, PostReactionType>>
}

async function getCurrentUserId(): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getPostViewerState(postIds: string[]): Promise<PostViewerState> {
  const uniquePostIds = Array.from(new Set(postIds)).slice(0, 50)
  if (IS_MOCK || uniquePostIds.length === 0) {
    return { isLoggedIn: false, myPostIds: [], myReactions: {} }
  }

  const userId = await getCurrentUserId()
  if (!userId) return { isLoggedIn: false, myPostIds: [], myReactions: {} }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const db = supabase as AnySupabase
  const [{ data: posts }, { data: reactions }] = await Promise.all([
    db
      .from('posts')
      .select('id')
      .in('id', uniquePostIds)
      .eq('user_id', userId),
    db
      .from('post_reactions')
      .select('post_id, reaction_type')
      .in('post_id', uniquePostIds)
      .eq('user_id', userId),
  ])

  return {
    isLoggedIn: true,
    myPostIds: (posts ?? []).map((post: { id: string }) => post.id),
    myReactions: Object.fromEntries(
      (reactions ?? []).map((reaction: { post_id: string; reaction_type: PostReactionType }) => [
        reaction.post_id,
        reaction.reaction_type,
      ]),
    ),
  }
}

export async function createPost(input: { type: string; content: string; url: string }): Promise<ActionResult> {
  const normalized = normalizePostInput(input)
  if ('error' in normalized) return { error: normalized.error }

  if (IS_MOCK) {
    revalidatePath('/posts')
    return { success: true }
  }

  const userId = await getCurrentUserId()
  if (!userId) return { error: '로그인이 필요합니다.' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const db = supabase as AnySupabase
  const { error } = await db
    .from('posts')
    .insert({
      user_id: userId,
      type: normalized.type,
      content: normalized.content,
      url: normalized.url,
      embed_kind: normalized.embed.kind,
      embed_title: normalized.embed.domain,
      embed_domain: normalized.embed.domain,
    })

  if (error) {
    console.error('createPost error:', error)
    return { error: '게시글 저장에 실패했어요. 다시 시도해주세요.' }
  }

  revalidatePath('/posts')
  return { success: true }
}

export async function updatePost(
  postId: string,
  input: { type: string; content: string; url: string },
): Promise<ActionResult> {
  const normalized = normalizePostInput(input)
  if ('error' in normalized) return { error: normalized.error }

  if (IS_MOCK) {
    revalidatePath('/posts')
    return { success: true }
  }

  const userId = await getCurrentUserId()
  if (!userId) return { error: '로그인이 필요합니다.' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const db = supabase as AnySupabase
  const { error } = await db
    .from('posts')
    .update({
      type: normalized.type,
      content: normalized.content,
      url: normalized.url,
      embed_kind: normalized.embed.kind,
      embed_title: normalized.embed.domain,
      embed_domain: normalized.embed.domain,
    })
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) {
    console.error('updatePost error:', error)
    return { error: '게시글 수정에 실패했어요. 다시 시도해주세요.' }
  }

  revalidatePath('/posts')
  return { success: true }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  if (IS_MOCK) {
    revalidatePath('/posts')
    return { success: true }
  }

  const userId = await getCurrentUserId()
  if (!userId) return { error: '로그인이 필요합니다.' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const db = supabase as AnySupabase
  const { error } = await db
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) {
    console.error('deletePost error:', error)
    return { error: '게시글 삭제에 실패했어요. 다시 시도해주세요.' }
  }

  revalidatePath('/posts')
  return { success: true }
}

export async function togglePostReaction(
  postId: string,
  currentReaction: PostReactionType | null,
  nextReaction: string,
): Promise<ActionResult> {
  if (!isReactionType(nextReaction)) return { error: '알 수 없는 반응입니다.' }

  if (IS_MOCK) return { success: true }

  const userId = await getCurrentUserId()
  if (!userId) return { error: '로그인이 필요합니다.' }

  const operation = getReactionToggleOperation(currentReaction, nextReaction)
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const db = supabase as AnySupabase

  if (operation.action === 'delete') {
    const { error } = await db
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) return { error: '반응 취소에 실패했어요.' }
    revalidatePath('/posts')
    return { success: true }
  }

  const { error } = await db
    .from('post_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      reaction_type: operation.reactionType,
    }, { onConflict: 'post_id,user_id' })

  if (error) return { error: '반응 저장에 실패했어요.' }
  revalidatePath('/posts')
  return { success: true }
}
