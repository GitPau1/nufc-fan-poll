'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { PollDetail, VoteCountMap } from '@/lib/queries/polls'
import type { CommentItem } from '@/lib/queries/comments'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { cn } from '@/lib/utils'
import { buildPollResultItems } from '@/lib/polls/result-ranking'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CommentsSection } from './CommentsSection'
import { PollPageHeader } from './PollPageHeader'
import { IS_MOCK } from '@/lib/config'

interface ResultViewProps {
  poll: PollDetail
  voteCounts: VoteCountMap
  myOptionId: string | null
  comments: CommentItem[]
}

export function ResultView({ poll, voteCounts, myOptionId, comments }: ResultViewProps) {
  const options  = poll.poll_options
  const counts   = options.map(o => voteCounts[o.id] ?? 0)
  const total    = counts.reduce((a, b) => a + b, 0)
  const isClosed = poll.status === 'closed'
  const resultItems = buildPollResultItems(options, voteCounts, myOptionId, poll.option_players)
  const topItem = resultItems[0]

  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

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
    ?? `https://placehold.co/480x160/0c2340/41b6e6?text=${encodeURIComponent(poll.title.slice(0, 4))}`

  const usesPlayerOptions = poll.type === 'selection' || poll.type === 'question_targets'

  // 현재 유저의 투표 항목 레이블
  const myVotedOptionLabel = myOptionId
    ? (options.find(o => o.id === myOptionId)?.label ?? null)
    : null

  return (
    <div className="flex flex-col min-h-screen">
      {/* 페이지 헤더 */}
      <PollPageHeader />

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-8 animate-enter">

        {/* 커버 이미지 — 칩 → 제목 순서로 오버레이 */}
        <div className="relative h-[160px] overflow-hidden">
          <img src={coverUrl} alt={poll.title} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 50%, rgba(0,0,0,.85) 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            {/* 칩 (제목 위) */}
            <div className="flex items-center gap-1.5 mb-2">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px] font-semibold pointer-events-none">
                {usesPlayerOptions ? '선택' : poll.type === 'free_choice' ? '자유 선택' : '평가'}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px] font-semibold pointer-events-none">
                {isClosed ? '투표 종료' : '진행 중'}
              </Badge>
              {myOptionId && (
                <Badge className="bg-primary text-white border-0 text-[11px] font-semibold gap-1 hover:bg-primary pointer-events-none">
                  <Check className="h-2.5 w-2.5" />
                  투표 완료
                </Badge>
              )}
            </div>
            {/* 제목 */}
            <div className="flex items-end justify-between gap-3">
              <p className="min-w-0 flex-1 text-[18px] font-black text-white leading-tight">{poll.title}</p>
              {poll.creator_name && (
                <span className="max-w-[38%] truncate text-right text-[12px] font-bold text-white/80">{poll.creator_name}</span>
              )}
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-4 py-4 flex flex-col gap-5">

          {/* 총 참여자 */}
          <p className="text-sm text-muted-foreground">
            총{' '}
            <span className="font-bold text-foreground">
              {total.toLocaleString()}명
            </span>{' '}
            참여
          </p>

          {/* 종료 후 최다득표 카드 */}
          {isClosed && total > 0 && topItem && (
            <div className="rounded-md border border-primary/60 bg-surface p-4 shadow-g200">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary-dark">
                최다 득표
              </p>
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-end gap-3">
                  {topItem.imageUrl && (
                    <img
                      src={topItem.imageUrl}
                      alt={topItem.option.label}
                      className="h-[72px] w-[72px] flex-shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="break-keep text-xl font-black leading-tight text-foreground">
                      {topItem.option.label}
                    </p>
                    {topItem.isMine && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-primary-dark">
                        <Check className="h-3.5 w-3.5" />
                        <span>내 선택</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="flex-shrink-0 text-4xl font-black leading-none tabular-nums text-primary-dark">
                  {topItem.percent}%
                </p>
              </div>
            </div>
          )}

          {/* 순위 리스트 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <p className="text-[15px] font-black text-foreground">
                {isClosed ? '최종 순위' : '현재 순위'}
              </p>
              <span className="text-[12px] font-bold text-gray-3">득표율순</span>
            </div>

            {total === 0 ? (
              <div className="rounded-md border border-border bg-surface p-4 text-sm font-medium text-muted-foreground shadow-g200">
                아직 집계된 투표가 없습니다
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {resultItems.map(item => (
                  <div
                    key={item.option.id}
                    className={cn(
                      'relative min-h-[62px] overflow-hidden rounded-md border border-border bg-surface shadow-g100',
                      item.isMine && 'border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-md bg-primary-dim transition-all duration-700',
                        item === topItem && 'bg-primary/20'
                      )}
                      style={{ width: animated ? `${item.percent}%` : 0 }}
                    />
                    <div className="relative grid min-h-[62px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.option.label}
                            className="h-11 w-11 flex-shrink-0 rounded-sm object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className="min-w-0 truncate text-sm font-black text-foreground">
                              {item.option.label}
                            </p>
                            {item.isMine && (
                              <Badge className="flex-shrink-0 bg-primary-dim px-1.5 text-[10px] font-bold text-primary-dark hover:bg-primary-dim">
                                내 선택
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                            <span className="flex-shrink-0 text-[12px] font-bold text-muted-foreground">
                              {item.count.toLocaleString()}명
                            </span>
                            {item.option.description && (
                              <>
                                <span className="text-[12px] text-gray-3">·</span>
                                <span className="line-clamp-1 min-w-0 text-[12px] font-medium leading-snug text-muted-foreground">
                                  {item.option.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        'flex-shrink-0 text-lg font-black tabular-nums',
                        item.isMine ? 'text-primary-dark' : 'text-gray-1'
                      )}>
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선수 정보 (평가 투표) */}
          {poll.player && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  선수 정보
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={poll.player.photo_url
                      ?? `https://placehold.co/44x44/0c2340/41b6e6?text=${poll.player.squad_number}`}
                    alt={poll.player.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-border"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">{poll.player.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {poll.player.position}
                      <span className="mx-1.5">·</span>
                      <span className="font-semibold text-primary">#{poll.player.squad_number}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 댓글 */}
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
