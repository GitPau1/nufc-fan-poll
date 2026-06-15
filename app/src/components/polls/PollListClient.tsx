'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users } from 'lucide-react'
import { PollCard, formatTimeLeft, getStatusLabel, getThumbnailUrl } from './PollCard'
import { PollFeedAnalytics } from '@/components/analytics/AppAnalytics'
import { getSourcePage, trackEvent } from '@/lib/analytics/mixpanel'
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
  const featuredPoll = effectivePolls[0] ?? null
  const listPolls = featuredPoll ? visiblePolls.filter(poll => poll.id !== featuredPoll.id) : visiblePolls

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
    <div className="px-4 pt-4 pb-10 animate-enter">
      <PollFeedAnalytics sourcePage="polls" pollCount={effectivePolls.length} />
      {featuredPoll && <PollHeroCard poll={featuredPoll} />}
      <div className="py-3">
        <PollTabs activeTab={activeTab} ongoingCount={ongoing.length} closedCount={closed.length} onChange={setActiveTab} />
      </div>

      {listPolls.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="divide-y divide-border">
            {listPolls.map(p => <PollCard key={p.id} poll={p} />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-surface py-20">
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

function PollHeroCard({ poll }: { poll: PollListItem }) {
  const pathname = usePathname()

  return (
    <Link
      href={`/polls/${poll.id}`}
      prefetch={false}
      onClick={() => trackEvent('poll_card_clicked', {
        source_page: getSourcePage(pathname),
        poll_id: poll.id,
        poll_type: poll.type,
        poll_status: poll.status,
        creator_type: poll.created_by && poll.creator_name ? 'user' : 'admin',
      })}
      className="relative block aspect-[16/9] overflow-hidden rounded-lg bg-disabled"
    >
      <img src={getThumbnailUrl(poll)} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121314]" />
      <div className="absolute left-4 top-[63%] flex items-center gap-2">
        <span className="inline-flex h-[21px] items-center rounded-pill bg-primary/55 px-[9px] text-[10px] font-semibold leading-[15px] text-white backdrop-blur-[2px]">
          {poll.status === 'active' ? formatTimeLeft(poll.closes_at) : getStatusLabel(poll)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] leading-[14px] text-white">
          <Users className="h-3.5 w-3.5" />
          {poll.vote_count.toLocaleString()}명
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-4">
        <p className="truncate text-[17px] font-bold leading-5 text-white">{poll.title}</p>
        {poll.description && (
          <p className="mt-1 truncate text-[12px] leading-[16.5px] text-[#c7c7c7]">{poll.description}</p>
        )}
      </div>
    </Link>
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
    { id: 'ongoing' as const, label: '진행중', count: ongoingCount },
    { id: 'closed' as const, label: '종료', count: closedCount },
  ]

  return (
    <div className="flex w-full rounded-pill bg-[#eaeaea] p-1">
      {tabs.map(tab => {
        const selected = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`h-8 flex-1 rounded-pill px-2.5 text-center text-[12px] leading-[18px] transition-colors ${selected ? 'bg-surface font-semibold text-primary' : 'font-medium text-gray-3 hover:text-gray-2'}`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
