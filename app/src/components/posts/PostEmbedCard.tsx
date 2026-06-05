'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import type { PostListItem } from '@/lib/queries/posts'
import { trackEvent } from '@/lib/analytics/mixpanel'

declare global {
  interface Window {
    twttr?: { widgets?: { load: () => void } }
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      return parsed.searchParams.get('v') ?? (
        parsed.pathname.startsWith('/shorts/') ? parsed.pathname.split('/')[2] : null
      )
    }
    return null
  } catch {
    return null
  }
}

export function PostEmbedCard({ post }: { post: PostListItem }) {
  const [playing, setPlaying] = useState(false)
  const url = post.url
  const domain = post.embed_domain ?? (url ? getDomain(url) : '')
  const title = post.embed_title ?? url

  useEffect(() => {
    if (post.embed_kind !== 'x') return
    if (window.twttr?.widgets) {
      window.twttr.widgets.load()
      return
    }

    const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.charset = 'utf-8'
    document.body.appendChild(script)
  }, [post.embed_kind])

  if (!url) return null

  function trackClick() {
    trackEvent('post_embed_clicked', {
      source_page: 'posts',
      post_type: post.type,
      embed_kind: post.embed_kind,
      source_domain: domain,
    })
  }

  if (post.embed_kind === 'youtube') {
    const videoId = getYouTubeId(url)
    if (videoId && playing) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title ?? 'YouTube video'}
          className="mt-3 aspect-video w-full rounded-sm bg-[#0c2340]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }

    if (videoId) {
      return (
        <button
          type="button"
          onClick={() => {
            trackClick()
            setPlaying(true)
          }}
          className="relative mt-3 block aspect-video w-full overflow-hidden rounded-sm bg-[#0c2340]"
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-primary-dark">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 shadow-w200">
              <Play className="h-7 w-7 fill-current" />
            </span>
          </span>
        </button>
      )
    }
  }

  if (post.embed_kind === 'x') {
    return (
      <blockquote className="twitter-tweet mt-3" data-dnt="true">
        <a href={url} onClick={trackClick}>{title}</a>
      </blockquote>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={trackClick}
      className="mt-3 block rounded-sm border border-border bg-background px-3 py-3"
    >
      <p className="text-[11px] font-black text-primary-dark">{domain}</p>
      <p className="mt-1 line-clamp-2 text-[13px] font-black leading-snug text-foreground">{title}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        원문 열기
        <ExternalLink className="h-3 w-3" />
      </p>
    </a>
  )
}
