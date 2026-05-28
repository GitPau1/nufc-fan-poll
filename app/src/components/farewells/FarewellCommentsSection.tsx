'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import type { FarewellCommentItem } from '@/lib/queries/farewells'
import { submitFarewellComment } from '@/lib/actions/farewells'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

type LocalComment = FarewellCommentItem & { _local?: boolean }

export function FarewellCommentsSection({
  farewellId,
  initialComments,
  isAuthenticated,
  isMockMode = false,
}: {
  farewellId: string
  initialComments: FarewellCommentItem[]
  isAuthenticated: boolean
  isMockMode?: boolean
}) {
  const [comments, setComments] = useState<LocalComment[]>(initialComments)
  const [text, setText] = useState('')
  const [isPending, start] = useTransition()

  function handleSubmit() {
    if (!text.trim() || !isAuthenticated) return
    const content = text.trim()
    const newComment: LocalComment = {
      id: `local-${Date.now()}`,
      farewell_id: farewellId,
      content,
      created_at: new Date().toISOString(),
      user: { display_name: isMockMode ? '나' : '익명', avatar_url: null },
      _local: true,
    }

    start(async () => {
      const result = await submitFarewellComment(farewellId, content)
      if ('success' in result) {
        setComments(prev => [newComment, ...prev])
        setText('')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Messages · {comments.length}개
        </p>
      </div>

      {isAuthenticated ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              placeholder="선수에게 남기고 싶은 한마디를 적어주세요."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all"
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
          {text.length > 400 && (
            <p className="text-xs text-muted-foreground text-right">{text.length} / 500</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-secondary/40 px-3 py-3">
          <p className="text-sm font-semibold text-foreground">로그인 후 한마디를 남길 수 있어요.</p>
          <p className="text-xs text-muted-foreground mt-1">팬들의 메시지는 모두에게 공개됩니다.</p>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          첫 번째 메시지를 남겨보세요.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map(comment => {
            const name = comment.user.display_name ?? '익명'
            const initial = name[0]?.toUpperCase() ?? '?'

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap leading-none">
                    <span className="text-xs font-semibold text-foreground leading-none">{name}</span>
                    <span className="text-[10px] leading-none text-muted-foreground">
                      {formatRelative(comment.created_at)}
                    </span>
                    {comment._local && (
                      <span className="text-[10px] leading-none text-primary">방금 등록</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
