'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PostComposer } from '@/components/posts/PostComposer'
import { PostCard } from '@/components/posts/PostCard'
import type { PostListItem } from '@/lib/queries/posts'
import type { PostEmbedKind, PostType } from '@/types/database'
import { trackEvent } from '@/lib/analytics/mixpanel'

type PostFilter = 'all' | PostType
type SortMode = 'latest' | 'popular'

const FILTERS: Array<{ id: PostFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'free', label: '자유' },
  { id: 'info', label: '정보' },
  { id: 'official', label: '오피셜' },
]

function reactionTotal(post: PostListItem): number {
  return Object.values(post.reaction_counts).reduce((sum, count) => sum + count, 0)
}

function getTopEmbedKind(posts: PostListItem[]): PostEmbedKind {
  return posts.find(post => post.embed_kind !== 'none')?.embed_kind ?? 'none'
}

export function PostFeedClient({
  initialPosts,
  isLoggedIn,
}: {
  initialPosts: PostListItem[]
  isLoggedIn: boolean
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [filter, setFilter] = useState<PostFilter>('all')
  const [sort, setSort] = useState<SortMode>('latest')
  const [sheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  useEffect(() => {
    trackEvent('post_feed_viewed', {
      source_page: 'posts',
      post_type_filter: filter,
      sort,
      feed_item_count: posts.length,
      top_embed_kind: getTopEmbedKind(posts),
    })
  }, [filter, posts, sort])

  const visiblePosts = useMemo(() => {
    const filtered = filter === 'all' ? posts : posts.filter(post => post.type === filter)
    return [...filtered].sort((a, b) => {
      if (sort === 'popular') {
        const diff = reactionTotal(b) - reactionTotal(a)
        if (diff !== 0) return diff
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filter, posts, sort])

  function openComposer() {
    setSheetOpen(true)
    trackEvent('post_create_clicked', {
      source_page: 'posts',
    })
  }

  return (
    <>
      <div className="animate-enter pb-10">
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 pt-2 backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto">
              {FILTERS.map(item => {
                const active = item.id === filter
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`relative h-11 shrink-0 text-[14px] font-black transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.label}
                    {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </div>
            <select
              value={sort}
              onChange={event => setSort(event.target.value as SortMode)}
              className="mb-2 h-8 shrink-0 rounded-sm border border-border bg-surface px-2 text-[12px] font-black text-foreground focus:border-primary focus:outline-none"
            >
              <option value="latest">최신순</option>
              <option value="popular">반응순</option>
            </select>
          </div>
        </div>

        <div className="px-4 pt-3">
          {visiblePosts.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-g200">
              {visiblePosts.map(post => (
                <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface px-4 py-20 text-center shadow-g200">
              <p className="text-sm font-black text-foreground">표시할 소식이 없습니다</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">다른 탭이나 정렬을 선택해보세요</p>
            </div>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-[480px]">
          <button
            type="button"
            onClick={openComposer}
            className="pointer-events-auto absolute bottom-0 right-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-w300"
            title="소식 작성"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="닫기"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative w-full max-w-[480px] rounded-t-2xl border border-border bg-surface shadow-w300">
            <PostComposer
              onSaved={() => {
                setSheetOpen(false)
                router.refresh()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
