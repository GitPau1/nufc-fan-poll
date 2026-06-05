'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deletePost } from '@/lib/actions/posts'
import type { PostListItem } from '@/lib/queries/posts'
import type { PostType } from '@/types/database'
import { badgeVariants } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PostComposer } from './PostComposer'
import { PostEmbedCard } from './PostEmbedCard'
import { PostReactionRow } from './PostReactionRow'

const TYPE_LABELS: Record<PostType, string> = {
  free: '자유',
  info: '정보',
  official: '오피셜',
}

const TYPE_BADGE_VARIANTS = {
  free: 'outline',
  info: 'secondary',
  official: 'default',
} as const

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '방금'
  if (diff < hour) return `${Math.floor(diff / minute)}분`
  if (diff < day) return `${Math.floor(diff / hour)}시간`
  if (diff < 7 * day) return `${Math.floor(diff / day)}일`

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(iso))
}

function isEdited(post: PostListItem): boolean {
  return Math.abs(new Date(post.updated_at).getTime() - new Date(post.created_at).getTime()) > 1000
}

export function PostCard({ post, isLoggedIn }: { post: PostListItem; isLoggedIn: boolean }) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, start] = useTransition()
  const router = useRouter()
  const author = post.user.display_name ?? '익명 팬'
  const initial = author.slice(0, 1)

  function remove() {
    if (!window.confirm('게시글을 삭제할까요?')) return
    start(async () => {
      const result = await deletePost(post.id)
      if (!('error' in result)) router.refresh()
    })
  }

  if (editing) {
    return (
      <article className="border-b border-border bg-surface">
        <PostComposer
          editingPost={post}
          variant="inline"
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            router.refresh()
          }}
        />
      </article>
    )
  }

  return (
    <article className="border-b border-border bg-surface px-4 py-4 last:border-b-0">
<div className="flex items-start gap-2.5">
  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-dim text-[12px] font-black text-primary-dark">
    {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-foreground">{author}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                {formatRelative(post.created_at)}
                {isEdited(post) ? ' · 수정됨' : ''}
              </p>
            </div>

            {post.is_mine && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(open => !open)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                  title="게시글 메뉴"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-10 w-28 rounded-md border border-border bg-surface py-1 shadow-w200">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        setEditing(true)
                      }}
                      className="flex h-9 w-full items-center gap-2 px-3 text-left text-[12px] font-bold text-foreground hover:bg-background"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={isPending}
                      className="flex h-9 w-full items-center gap-2 px-3 text-left text-[12px] font-bold text-negative hover:bg-background disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-[14px] font-semibold leading-relaxed text-foreground">
            <span className={cn(
              badgeVariants({ variant: TYPE_BADGE_VARIANTS[post.type] }),
              'pointer-events-none mr-1.5 align-baseline font-bold',
            )}>
              {TYPE_LABELS[post.type]}
            </span>
            {post.content}
          </p>

          <PostEmbedCard post={post} />
          <PostReactionRow post={post} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </article>
  )
}
