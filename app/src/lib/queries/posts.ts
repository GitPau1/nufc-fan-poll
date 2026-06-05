import { createClient, createPublicClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/config'
import type { PostEmbedKind, PostReactionType, PostType } from '@/types/database'
import { mockGetPostList } from '@/lib/mock/queries'

export type ReactionCountMap = Record<PostReactionType, number>

export type PostListItem = {
  id: string
  type: PostType
  content: string
  url: string | null
  embed_kind: PostEmbedKind
  embed_title: string | null
  embed_domain: string | null
  created_at: string
  updated_at: string
  user: { display_name: string | null; avatar_url: string | null }
  is_mine: boolean
  my_reaction: PostReactionType | null
  reaction_counts: ReactionCountMap
}

type PostQueryReaction = {
  user_id: string
  reaction_type: PostReactionType
}

type PostQueryProfile = {
  display_name: string | null
  avatar_url: string | null
}

type PostQueryRow = {
  id: string
  user_id: string
  type: PostType
  content: string
  url: string | null
  embed_kind: PostEmbedKind
  embed_title: string | null
  embed_domain: string | null
  created_at: string
  updated_at: string
  user: PostQueryProfile | PostQueryProfile[] | null
  reactions: PostQueryReaction[] | null
}

type PostQueryError = {
  message?: string
} | null

const EMPTY_COUNTS: ReactionCountMap = {
  expecting: 0,
  shocked: 0,
  angry: 0,
  sad: 0,
  curious: 0,
}

export async function getPostList(userId: string | null): Promise<PostListItem[]> {
  if (IS_MOCK) return mockGetPostList(userId)

  const supabase = userId ? await createClient() : createPublicClient()

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, type, content, url, embed_kind, embed_title, embed_domain, created_at, updated_at,
      user:public_profiles!posts_public_profiles_user_id_fkey(display_name, avatar_url),
      reactions:post_reactions(user_id, reaction_type)
    `)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as { data: PostQueryRow[] | null; error: PostQueryError }

  if (error || !data) {
    console.error('getPostList error:', error)
    return []
  }

  return data.map(row => {
    const reactionCounts = { ...EMPTY_COUNTS }
    let myReaction: PostReactionType | null = null

    for (const reaction of row.reactions ?? []) {
      const type = reaction.reaction_type as PostReactionType
      reactionCounts[type] = (reactionCounts[type] ?? 0) + 1
      if (userId && reaction.user_id === userId) myReaction = type
    }

    const profile = Array.isArray(row.user) ? row.user[0] : row.user

    return {
      id: row.id,
      type: row.type,
      content: row.content,
      url: row.url,
      embed_kind: row.embed_kind,
      embed_title: row.embed_title,
      embed_domain: row.embed_domain,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      is_mine: userId === row.user_id,
      my_reaction: myReaction,
      reaction_counts: reactionCounts,
    }
  })
}
