'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Separator } from '@/components/ui/separator'
import { PollCard } from './PollCard'
import { loadMorePolls } from '@/lib/actions/polls'
import type { PollListItem } from '@/lib/queries/polls'
import { PAGE_SIZE } from '@/lib/constants'

interface PollListClientProps {
  initialPolls: PollListItem[]
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
      {children}
    </p>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  )
}

export function PollListClient({ initialPolls }: PollListClientProps) {
  const [polls, setPolls]     = useState<PollListItem[]>(initialPolls)
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(initialPolls.length === PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const sentinelRef           = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const next = await loadMorePolls(page)
      if (next.length < PAGE_SIZE) setHasMore(false)
      setPolls(prev => [...prev, ...next])
      setPage(p => p + 1)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const active    = polls.filter(p => p.status === 'active')
  const scheduled = polls.filter(p => p.status === 'scheduled')
  const closed    = polls.filter(p => p.status === 'closed')

  if (polls.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-semibold text-foreground">투표가 없습니다</p>
        <p className="text-xs text-muted-foreground">곧 새로운 투표가 공개될 예정입니다</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-10 flex flex-col gap-3 animate-enter">
      {active.length > 0 && (
        <>
          <SectionLabel>{`진행 중 · ${active.length}개`}</SectionLabel>
          {active.map(p => <PollCard key={p.id} poll={p} />)}
        </>
      )}

      {scheduled.length > 0 && (
        <>
          <SectionDivider label="공개 예정" />
          {scheduled.map(p => <PollCard key={p.id} poll={p} />)}
        </>
      )}

      {closed.length > 0 && (
        <>
          <SectionDivider label="종료됨" />
          {closed.map(p => <PollCard key={p.id} poll={p} />)}
        </>
      )}

      <div ref={sentinelRef} />
      {loading && <Spinner />}
    </div>
  )
}
