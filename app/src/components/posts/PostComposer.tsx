'use client'

import { useState, useTransition } from 'react'
import { createPost, updatePost } from '@/lib/actions/posts'
import { getEmbedKind, normalizeUrl, POST_MAX_LENGTH, POST_MIN_LENGTH } from '@/lib/posts'
import type { PostListItem } from '@/lib/queries/posts'
import type { PostType } from '@/types/database'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { Button } from '@/components/ui/button'

const POST_TYPES: Array<{ id: PostType; label: string }> = [
  { id: 'free', label: '자유' },
  { id: 'info', label: '정보' },
  { id: 'official', label: '오피셜' },
]

function getUrlPlaceholder(type: PostType): string {
  if (type === 'official') return '구단 공식 출처 URL을 공유해주세요'
  return 'X, YouTube 링크는 임베드로 보여져요'
}

export function PostComposer({
  editingPost = null,
  onSaved,
  onCancel,
  variant = 'sheet',
}: {
  editingPost?: PostListItem | null
  onSaved: () => void
  onCancel?: () => void
  variant?: 'sheet' | 'inline'
}) {
  const [type, setType] = useState<PostType>(editingPost?.type ?? 'free')
  const [content, setContent] = useState(editingPost?.content ?? '')
  const [url, setUrl] = useState(editingPost?.url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()
  const canSubmit = content.trim().length >= POST_MIN_LENGTH && !isPending

  function submit() {
    if (!canSubmit) return
    setError(null)
    const payload = { type, content, url }

    start(async () => {
      const result = editingPost
        ? await updatePost(editingPost.id, payload)
        : await createPost(payload)

      if ('error' in result) {
        setError(result.error)
        return
      }

      if (!editingPost) {
        const embedKind = getEmbedKind(normalizeUrl(url)).kind
        trackEvent('post_published', {
          source_page: 'posts',
          post_type: type,
          embed_kind: embedKind,
          has_url: Boolean(url.trim()),
        })
        setContent('')
        setUrl('')
        setType('free')
      }

      onSaved()
    })
  }

  const body = (
    <div className={variant === 'sheet' ? 'px-4 pb-5' : 'border-b border-border bg-surface px-4 py-4'}>
      <div className="mb-3 inline-flex rounded-lg border border-border bg-background p-1">
        {POST_TYPES.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setType(item.id)}
            className={`h-8 rounded-xs px-3 text-[12px] font-bold transition-opacity hover:opacity-70 active:opacity-50 ${type === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={event => setContent(event.target.value.slice(0, POST_MAX_LENGTH))}
        rows={3}
        placeholder={type === 'official' ? '공식 계정, 구단 발표, 선수 채널 등 공식 출처의 내용만 URL과 함께 공유해주세요.' : '짧은 소식이나 생각을 남겨주세요.'}
        className="h-[92px] w-full resize-none rounded-sm border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none"
      />

      <div className="mt-1 flex justify-end text-[11px] font-bold text-muted-foreground">
        {content.length} / {POST_MAX_LENGTH}
      </div>

      <input
        value={url}
        onChange={event => setUrl(event.target.value)}
        placeholder={getUrlPlaceholder(type)}
        className="mt-2 h-10 w-full rounded-sm border border-border bg-background px-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none"
      />

      {error && <p className="mt-2 text-xs font-semibold text-negative">{error}</p>}

      {variant === 'inline' && (
        <div className="mt-3 flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
              취소
            </Button>
          )}
          <Button type="button" size="sm" onClick={submit} disabled={!canSubmit}>
            수정
          </Button>
        </div>
      )}
    </div>
  )

  if (variant === 'inline') return body

  return (
    <>
      <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" />
      <div className="flex items-center justify-between px-4 pb-3 pt-3">
        <h2 className="text-[16px] font-black text-foreground">소식 작성</h2>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="h-8 min-w-[52px] rounded-sm bg-primary px-3 text-[13px] font-black text-primary-foreground shadow-w200 transition-opacity disabled:bg-disabled disabled:text-gray-3 disabled:shadow-none"
        >
          게시
        </button>
      </div>
      {body}
    </>
  )
}
