import type { PostEmbedKind, PostReactionType, PostType } from '@/types/database'

export const POST_MAX_LENGTH = 300
export const POST_MIN_LENGTH = 15

const POST_TYPES = ['free', 'info', 'official'] as const

export const POST_REACTIONS: Array<{ type: PostReactionType; emoji: string; label: string }> = [
  { type: 'expecting', emoji: '🙌', label: '기대' },
  { type: 'shocked', emoji: '😳', label: '충격' },
  { type: 'angry', emoji: '😡', label: '분노' },
  { type: 'sad', emoji: '😢', label: '아쉬움' },
  { type: 'curious', emoji: '🤔', label: '의문' },
]

type NormalizedPost = {
  type: PostType
  content: string
  url: string | null
  embed: {
    kind: PostEmbedKind
    domain: string | null
    youtubeId?: string
  }
}

type PostInputResult = NormalizedPost | { error: string }

export function isPostType(value: string): value is PostType {
  return (POST_TYPES as readonly string[]).includes(value)
}

export function isReactionType(value: string): value is PostReactionType {
  return POST_REACTIONS.some(reaction => reaction.type === value)
}

export function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    return new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    )
  } catch {
    return null
  }
}

export function getEmbedKind(url: URL | null): NormalizedPost['embed'] {
  if (!url) return { kind: 'none', domain: null }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'x.com' || host === 'twitter.com') return { kind: 'x', domain: host }

  if (host === 'youtu.be') {
    const youtubeId = url.pathname.split('/').filter(Boolean)[0]
    return youtubeId ? { kind: 'youtube', domain: host, youtubeId } : { kind: 'link', domain: host }
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const youtubeId = url.searchParams.get('v') ?? (
      url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : null
    )
    return youtubeId ? { kind: 'youtube', domain: host, youtubeId } : { kind: 'link', domain: host }
  }

  return { kind: 'link', domain: host }
}

export function normalizePostInput(input: { type: string; content: string; url: string }): PostInputResult {
  if (!isPostType(input.type)) return { error: '게시글 유형을 선택해주세요.' }

  const content = input.content.trim()
  if (!content) return { error: '내용을 입력해주세요.' }
  if (content.length < POST_MIN_LENGTH) return { error: '게시글은 15자 이상 입력해주세요.' }
  if (content.length > POST_MAX_LENGTH) return { error: '게시글은 300자 이하로 입력해주세요.' }

  const url = normalizeUrl(input.url)
  if (input.url.trim() && !url) return { error: '올바른 URL을 입력해주세요.' }
  if (input.type === 'official' && !url) return { error: '오피셜 소식은 출처 URL이 필요합니다.' }

  const embed = getEmbedKind(url)
  return {
    type: input.type,
    content,
    url: url?.toString() ?? null,
    embed,
  }
}

export function getReactionToggleOperation(
  currentReaction: PostReactionType | null,
  nextReaction: PostReactionType,
): { action: 'create' | 'update'; reactionType: PostReactionType } | { action: 'delete' } {
  if (!currentReaction) return { action: 'create', reactionType: nextReaction }
  if (currentReaction === nextReaction) return { action: 'delete' }
  return { action: 'update', reactionType: nextReaction }
}
