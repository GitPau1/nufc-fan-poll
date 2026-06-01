'use client'

import { useState, useTransition } from 'react'
import { Check, Heart, Send, X } from 'lucide-react'
import type { CommentItem } from '@/lib/queries/comments'
import type { PollStatus, PollType } from '@/types/database'
import { deleteComment, submitComment, toggleLike, updateComment } from '@/lib/actions/comments'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface CommentsSectionProps {
  pollId: string
  pollType: PollType
  pollStatus: PollStatus
  creatorType: 'admin' | 'user'
  initialComments: CommentItem[]
  isMockMode?: boolean
  myVotedOptionLabel?: string | null  // 현재 유저의 투표 항목 (입력 힌트용)
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return '방금 전'
  if (min < 60)  return `${min}분 전`
  const h = Math.floor(min / 60)
  if (h < 24)    return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30)    return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

type LocalComment = CommentItem & { _local?: boolean }

export function CommentsSection({
  pollId,
  pollType,
  pollStatus,
  creatorType,
  initialComments,
  isMockMode = false,
  myVotedOptionLabel = null,
}: CommentsSectionProps) {
  const [comments, setComments]   = useState<LocalComment[]>(initialComments)
  const [text, setText]           = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isPending, start]        = useTransition()

  function handleSubmit() {
    if (!text.trim()) return
    const content = text.trim()

    start(async () => {
      const result = await submitComment(pollId, content)
      if ('success' in result) {
        trackEvent('comment_submitted', {
          source_page: 'poll_detail',
          poll_id: pollId,
          poll_type: pollType,
          poll_status: pollStatus,
          creator_type: creatorType,
          comment_length: content.length,
        })
        setComments(prev => [{
          ...result.comment,
          voted_option_label: result.comment.voted_option_label ?? myVotedOptionLabel ?? null,
        }, ...prev])
        setText('')
      }
    })
  }

  function startEditing(comment: LocalComment) {
    setEditingId(comment.id)
    setEditingText(comment.content)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingText('')
  }

  function handleUpdate(commentId: string) {
    const content = editingText.trim()
    if (!content) return

    start(async () => {
      const result = await updateComment(commentId, pollId, content)
      if ('success' in result) {
        setComments(prev => prev.map(comment => (
          comment.id === commentId
            ? {
              ...comment,
              content: result.comment.content,
              user: result.comment.user,
              is_mine: result.comment.is_mine,
              voted_option_label: result.comment.voted_option_label ?? comment.voted_option_label,
            }
            : comment
        )))
        cancelEditing()
      }
    })
  }

  function handleDelete(commentId: string) {
    if (!window.confirm('댓글을 삭제할까요?')) return

    start(async () => {
      const result = await deleteComment(commentId, pollId)
      if ('success' in result) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      }
    })
  }

  function handleLike(commentId: string) {
    const target = comments.find(comment => comment.id === commentId)
    if (!target?.is_liked) {
      trackEvent('comment_liked', {
        source_page: 'poll_detail',
        poll_id: pollId,
        poll_type: pollType,
        poll_status: pollStatus,
        creator_type: creatorType,
        comment_id: commentId,
      })
    }
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, is_liked: !c.is_liked, like_count: c.is_liked ? c.like_count - 1 : c.like_count + 1 }
        : c
    ))
    if (!isMockMode) {
      start(async () => { await toggleLike(commentId, pollId) })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          댓글 · {comments.length}개
        </p>
      </div>

      {/* 댓글 입력 */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 300))}
            placeholder="이번 투표에 대한 생각을 남겨주세요…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2.5
                       text-sm text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0
                       transition-all"
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl flex-shrink-0"
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* 투표 항목 표시 힌트 */}
        {myVotedOptionLabel && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
            <span className="opacity-60">💬</span>
            댓글에{' '}
            <Badge className="text-[10px] bg-primary/10 text-primary border-0 px-1.5 font-bold pointer-events-none hover:bg-primary/10">
              {myVotedOptionLabel}
            </Badge>
            {' '}항목이 함께 표시됩니다
          </p>
        )}

        {text.length > 200 && (
          <p className="text-xs text-muted-foreground text-right">{text.length} / 300</p>
        )}
      </div>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          첫 번째 댓글을 남겨보세요
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map(comment => {
            const name    = comment.user.display_name ?? '익명'
            const initial = name[0]?.toUpperCase() ?? '?'
            const isEditing = editingId === comment.id

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 leading-none">
                      <span className="text-xs font-semibold text-foreground leading-none">{name}</span>
                      {/* 댓글 작성자의 투표 항목 칩 */}
                      {comment.voted_option_label && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-0 px-1.5 font-bold flex-shrink-0 pointer-events-none hover:bg-primary/10">
                          {comment.voted_option_label}
                        </Badge>
                      )}
                      <span className="text-[10px] leading-none text-muted-foreground">
                        {formatRelative(comment.created_at)}
                      </span>
                      {comment._local && (
                        <span className="text-[10px] leading-none text-primary">방금 등록</span>
                      )}
                    </div>
                    {comment.is_mine && !isEditing && (
                      <div className="flex flex-shrink-0 gap-2 text-[11px] font-semibold leading-none text-muted-foreground">
                        <button type="button" onClick={() => startEditing(comment)} className="hover:text-foreground">
                          수정
                        </button>
                        <button type="button" onClick={() => handleDelete(comment.id)} className="hover:text-red-500">
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={event => setEditingText(event.target.value.slice(0, 300))}
                        rows={2}
                        className="resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-[12px]" onClick={cancelEditing} disabled={isPending}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" className="h-8 px-2 text-[12px]" onClick={() => handleUpdate(comment.id)} disabled={!editingText.trim() || isPending}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                  )}
                  <button
                    onClick={() => handleLike(comment.id)}
                    disabled={isEditing}
                    className={cn(
                      'flex items-center gap-1 mt-1.5 text-xs transition-all duration-100',
                      'active:scale-90',
                      isEditing && 'pointer-events-none opacity-50',
                      comment.is_liked
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Heart
                      className={cn('h-3.5 w-3.5', comment.is_liked && 'fill-primary')}
                    />
                    <span>{comment.like_count}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
