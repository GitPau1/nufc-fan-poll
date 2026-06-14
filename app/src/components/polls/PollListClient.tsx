'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PollCard } from './PollCard'
import { PollFeedAnalytics } from '@/components/analytics/AppAnalytics'
import { loadMorePolls } from '@/lib/actions/polls'
import { getEffectivePollStatus } from '@/lib/polls/status'
import type { PollListItem } from '@/lib/queries/polls'
import { PAGE_SIZE } from '@/lib/constants'

interface PollListClientProps {
  initialPolls: PollListItem[]
  headerRight?: React.ReactNode
}

type PollTab = 'ongoing' | 'closed'

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  )
}

export function PollListClient({ initialPolls, headerRight }: PollListClientProps) {
  const [polls, setPolls]     = useState<PollListItem[]>(initialPolls)
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(initialPolls.length === PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<PollTab>('ongoing')
  const [now, setNow] = useState(() => Date.now())
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const effectivePolls = polls.map(poll => ({
    ...poll,
    status: getEffectivePollStatus(poll, new Date(now)),
  }))
  const ongoing = effectivePolls.filter(p => p.status !== 'closed')
  const closed  = effectivePolls.filter(p => p.status === 'closed')
  const visiblePolls = activeTab === 'ongoing' ? ongoing : closed

  if (polls.length === 0 && !loading) {
    return (
      <div className="px-4 pt-4 animate-enter">
        <PollFeedAnalytics sourcePage="polls" pollCount={0} />
        <div className="mb-4 flex items-center justify-between gap-3">
          <PollTabs activeTab={activeTab} ongoingCount={0} closedCount={0} onChange={setActiveTab} />
          {headerRight}
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-sm font-semibold text-foreground">투표가 없습니다</p>
          <p className="text-xs text-muted-foreground">곧 새로운 투표가 공개될 예정입니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-10 flex flex-col gap-3 animate-enter">
      <PollFeedAnalytics sourcePage="polls" pollCount={effectivePolls.length} />
      <div className="mb-1">
        <h1 className="text-[22px] font-black tracking-tight text-foreground">투표</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">팬들의 반응이 쌓이는 질문입니다.</p>
      </div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <PollTabs activeTab={activeTab} ongoingCount={ongoing.length} closedCount={closed.length} onChange={setActiveTab} />
        {headerRight}
      </div>

      {visiblePolls.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visiblePolls.map(p => <PollCard key={p.id} poll={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm font-semibold text-foreground">
            {activeTab === 'ongoing' ? '진행 중인 투표가 없습니다' : '종료된 투표가 없습니다'}
          </p>
        </div>
      )}

      <div ref={sentinelRef} />
      {loading && <Spinner />}
    </div>
  )
}

function PollTabs({
  activeTab,
  ongoingCount,
  closedCount,
  onChange,
}: {
  activeTab: PollTab
  ongoingCount: number
  closedCount: number
  onChange: (tab: PollTab) => void
}) {
  const tabs = [
    { id: 'ongoing' as const, label: '진행중인 투표', count: ongoingCount },
    { id: 'closed' as const, label: '종료된 투표', count: closedCount },
  ]

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1">
      {tabs.map(tab => {
        const selected = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`h-8 rounded-md px-2.5 text-[12px] font-bold transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label} {tab.count}
          </button>
        )
      })}
    </div>
  )
}
