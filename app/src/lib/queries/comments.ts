import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/config'
import { mockGetComments } from '@/lib/mock/queries'

export type CommentItem = {
  id: string
  poll_id: string
  content: string
  created_at: string
  user: { display_name: string | null; avatar_url: string | null }
  like_count: number
  is_liked: boolean
  voted_option_label: string | null  // 댓글 작성자가 선택한 투표 항목
}

export async function getComments(
  pollId: string,
  userId: string | null,
): Promise<CommentItem[]> {
  if (IS_MOCK) return mockGetComments(pollId, userId)

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('comments')
    .select(`
      id, poll_id, content, created_at,
      user:users(display_name, avatar_url),
      like_count:comment_likes(count)
    `)
    .eq('poll_id', pollId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row: any) => ({
    id:         row.id,
    poll_id:    row.poll_id,
    content:    row.content,
    created_at: row.created_at,
    user: {
      display_name: row.user?.display_name ?? null,
      avatar_url:   row.user?.avatar_url ?? null,
    },
    like_count:          (row.like_count as { count: number }[])?.[0]?.count ?? 0,
    is_liked:            false, // TODO: check per-user like status
    voted_option_label:  null,  // TODO: join votes + poll_options
  }))
}
