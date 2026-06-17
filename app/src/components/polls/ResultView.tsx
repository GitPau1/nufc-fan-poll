'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Users } from 'lucide-react'
import type { PollDetail, VoteCountMap } from '@/lib/queries/polls'
import type { CommentItem } from '@/lib/queries/comments'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { CommentsSection } from './CommentsSection'
import { IS_MOCK } from '@/lib/config'

interface ResultViewProps {
  poll: PollDetail
  voteCounts: VoteCountMap
  myOptionId: string | null
  comments: CommentItem[]
}

function buildResultItems(poll: PollDetail, voteCounts: VoteCountMap) {
  const total = poll.poll_options.reduce((sum, option) => sum + (voteCounts[option.id] ?? 0), 0)

  return poll.poll_options
    .map((option) => {
      const count = voteCounts[option.id] ?? 0
      return {
        option,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.count - a.count || a.option.display_order - b.option.display_order)
}

function formatPollDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function ResultView({ poll, voteCounts, myOptionId, comments }: ResultViewProps) {
  const router = useRouter()
  const options  = poll.poll_options
  const counts   = options.map(o => voteCounts[o.id] ?? 0)
  const total    = counts.reduce((a, b) => a + b, 0)
  const isClosed = poll.status === 'closed'
  const resultItems = buildResultItems(poll, voteCounts)
  const topItem = resultItems[0]
  const rankedItems = total > 0 ? resultItems.slice(1) : resultItems
  const pollDate = formatPollDate(poll.created_at ?? poll.scheduled_at ?? poll.closes_at)

  useEffect(() => {
    trackEvent('poll_result_viewed', {
      source_page: 'poll_detail',
      poll_id: poll.id,
      poll_type: poll.type,
      poll_status: poll.status,
      creator_type: poll.created_by && poll.creator_name ? 'user' : 'admin',
      has_voted: Boolean(myOptionId),
      total_votes: total,
    })
  }, [myOptionId, poll.created_by, poll.creator_name, poll.id, poll.status, poll.type, total])

  const coverUrl = poll.thumbnail_url
    ?? poll.player?.photo_url
    ?? `https://placehold.co/480x252/0c2340/41b6e6?text=${encodeURIComponent(poll.title.slice(0, 4))}`

  // 현재 유저의 투표 항목 레이블
  const myVotedOptionLabel = myOptionId
    ? (options.find(o => o.id === myOptionId)?.label ?? null)
    : null

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4f5]">
      <div className="flex-1 overflow-y-auto hide-scrollbar animate-enter">
        <div className="bg-[radial-gradient(circle_at_85%_0%,rgba(101,175,244,0.28),rgba(255,255,255,0.92)_28%,#ffffff_58%)] pb-4 shadow-g200">
          <header className="flex h-[62px] items-center px-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-muted-foreground transition-opacity active:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </button>
          </header>

          <div className="px-3 pt-4">
            <img
              src={coverUrl}
              alt={poll.title}
              className="h-[252px] w-full rounded-lg object-cover"
            />
          </div>

          <div className="flex flex-col items-center gap-1 px-4 pt-4 text-center">
            <h1 className="break-keep text-[20px] font-bold leading-[23px] text-foreground">
              {poll.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] leading-[17px] text-muted-foreground">
              {pollDate && <span>{pollDate}</span>}
              <span>{poll.creator_name ?? 'Admin'}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[12px] font-medium leading-5 text-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{total.toLocaleString()}명</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-3 pb-8 pt-3">
          {total > 0 && topItem && (
            <div className="rounded-lg border border-border bg-[linear-gradient(180deg,rgba(178,214,255,0.24)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-[17px] text-center shadow-g200">
              <p className="text-[13px] font-bold leading-4 tracking-[0.04em] text-gray-1">
                {isClosed ? '최종 결과' : '현재 결과'}
              </p>
              <p className="mt-5 text-[40px] font-normal leading-none tracking-normal text-primary-dark tabular-nums">
                {topItem.percent}%
              </p>
              <p className="mt-3 break-keep text-[16px] font-semibold leading-[21px] text-gray-1">
                {topItem.option.label}
              </p>
              <p className="mt-2 text-[12px] font-medium leading-[18px] text-muted-foreground">
                {topItem.count.toLocaleString()}표
              </p>
            </div>
          )}

          <div>
            {total === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-5 text-center text-sm font-medium text-muted-foreground shadow-g200">
                아직 집계된 투표가 없습니다
              </div>
            ) : rankedItems.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-g200">
                {rankedItems.map((item, index) => (
                  <div key={item.option.id}>
                    <div className="grid min-h-[52px] grid-cols-[24px_minmax(0,1fr)_38px] items-center gap-2 px-3.5 py-3">
                      <span className="text-center text-[12px] font-medium leading-[22px] text-muted-foreground">
                        {index + 2}
                      </span>
                      <div className="min-w-0">
                        <p className="min-w-0 truncate text-[12px] font-medium leading-[21px] text-foreground">
                          {item.option.label}
                        </p>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="flex-shrink-0 text-[12px] font-medium leading-[18px] text-muted-foreground">
                            {item.count.toLocaleString()}표
                          </span>
                          {item.option.description && (
                            <>
                              <span className="text-[12px] text-gray-3">·</span>
                              <span className="line-clamp-1 min-w-0 text-[12px] font-medium leading-[18px] text-muted-foreground">
                                {item.option.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-right text-[12px] font-medium leading-[22px] text-muted-foreground tabular-nums">
                        {item.percent}%
                      </span>
                    </div>
                    {index < rankedItems.length - 1 && (
                      <div className="mx-3.5 h-px bg-border" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <CommentsSection
            pollId={poll.id}
            pollType={poll.type}
            pollStatus={poll.status}
            creatorType={poll.created_by && poll.creator_name ? 'user' : 'admin'}
            initialComments={comments}
            isMockMode={IS_MOCK}
            myVotedOptionLabel={myVotedOptionLabel}
          />
        </div>
      </div>
    </div>
  )
}
