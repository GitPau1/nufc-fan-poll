'use client'

import { useState, useTransition } from 'react'
import { togglePostReaction } from '@/lib/actions/posts'
import { POST_REACTIONS } from '@/lib/posts'
import type { PostListItem, ReactionCountMap } from '@/lib/queries/posts'
import type { PostReactionType } from '@/types/database'
import { trackEvent } from '@/lib/analytics/mixpanel'

function copyCounts(counts: ReactionCountMap): ReactionCountMap {
  return { ...counts }
}

export function PostReactionRow({ post, isLoggedIn }: { post: PostListItem; isLoggedIn: boolean }) {
  const [selected, setSelected] = useState<PostReactionType | null>(post.my_reaction)
  const [counts, setCounts] = useState<ReactionCountMap>(() => copyCounts(post.reaction_counts))
  const [isPending, start] = useTransition()

  function updateCounts(current: PostReactionType | null, next: PostReactionType) {
    const nextCounts = copyCounts(counts)
    if (current === next) {
      nextCounts[next] = Math.max(0, nextCounts[next] - 1)
      setSelected(null)
      setCounts(nextCounts)
      return
    }

    if (current) nextCounts[current] = Math.max(0, nextCounts[current] - 1)
    nextCounts[next] = nextCounts[next] + 1
    setSelected(next)
    setCounts(nextCounts)
  }

  function react(next: PostReactionType) {
    if (!isLoggedIn || isPending) return

    const previousSelected = selected
    const previousCounts = copyCounts(counts)
    updateCounts(previousSelected, next)

    start(async () => {
      const result = await togglePostReaction(post.id, previousSelected, next)
      if ('error' in result) {
        setSelected(previousSelected)
        setCounts(previousCounts)
        return
      }

      if (previousSelected !== next) {
        trackEvent('post_reacted', {
          source_page: 'posts',
          post_type: post.type,
          reaction_type: next,
        })
      }
    })
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
      {POST_REACTIONS.map(reaction => {
        const active = selected === reaction.type
        const disabled = !isLoggedIn || isPending
        return (
          <button
            key={reaction.type}
            type="button"
            onClick={() => react(reaction.type)}
            disabled={disabled}
            title={isLoggedIn ? reaction.label : '로그인 후 반응할 수 있어요'}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[12px] font-black transition-opacity hover:opacity-70 active:opacity-50 disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'border-primary/40 bg-primary-dim text-primary-dark' : 'border-border bg-background text-muted-foreground'}`}
          >
            <span aria-hidden>{reaction.emoji}</span>
            <span>{counts[reaction.type]}</span>
          </button>
        )
      })}
    </div>
  )
}
