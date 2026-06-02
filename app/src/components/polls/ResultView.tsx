'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { PollDetail, VoteCountMap } from '@/lib/queries/polls'
import type { CommentItem } from '@/lib/queries/comments'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { calcPercents } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  const percents = calcPercents(counts)

  const maxCount  = Math.max(...counts, 0)
  const winnerIdx = counts.indexOf(maxCount)

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

  // 최다득표 선수 사진 (selection 타입)
  const winnerOption      = options[winnerIdx]
  const winnerPlayer      = usesPlayerOptions && winnerOption?.player_id && poll.option_players
    ? poll.option_players[winnerOption.player_id] ?? null
    : null
  const winnerPlayerPhoto = winnerPlayer?.photo_url
    ?? winnerOption?.image_url
    ?? (winnerOption
      ? `https://placehold.co/56x56/ffffff/0c2340?text=${encodeURIComponent(winnerOption.label.slice(0, 1))}`
      : null)

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
                투표 종료
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

          {/* 최다득표 카드 */}
          {total > 0 && (
            <div className="rounded-md bg-primary p-5 text-primary-foreground shadow-g200">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-3">
                최다 득표
              </p>
              <div className="flex items-end justify-between gap-3">
                {/* 선수 사진 + 이름 (selection 타입) — 하단 정렬 */}
                <div className="flex items-end gap-3 min-w-0 flex-1">
                  {winnerPlayerPhoto && (
                    <img
                      src={winnerPlayerPhoto}
                      alt={winnerOption?.label ?? ''}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <p className="text-xl font-black leading-tight">
                    {winnerOption?.label}
                  </p>
                </div>
                <p className="text-4xl font-black shrink-0 tabular-nums">
                  {percents[winnerIdx]}%
                </p>
              </div>
              {myOptionId === winnerOption?.id && (
                <div className="flex items-center gap-1.5 mt-3 text-xs opacity-80">
                  <Check className="h-3.5 w-3.5" />
                  <span>내 선택</span>
                </div>
              )}
            </div>
          )}

          {/* 분포 바 */}
          <Card>
            <CardContent className="p-4 flex flex-col gap-4">
              {options.map((option, i) => {
                const isMine = option.id === myOptionId

                // 선택 투표: 선수 사진 조회
                const playerPhoto = usesPlayerOptions && option.player_id && poll.option_players
                  ? (poll.option_players[option.player_id]?.photo_url ?? null)
                  : null
                const playerNum = usesPlayerOptions && option.player_id && poll.option_players
                  ? (poll.option_players[option.player_id]?.squad_number ?? null)
                  : null

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span className={cn(
                        'text-sm font-semibold flex items-center gap-2 min-w-0',
                        isMine ? 'text-primary' : 'text-foreground'
                      )}>
                        {/* 선택 투표 선수 사진 (정사각형) */}
                        {(usesPlayerOptions || option.image_url) && (
                          <img
                            src={option.image_url
                              ?? playerPhoto
                              ?? `https://placehold.co/36x36/0c2340/41b6e6?text=${encodeURIComponent(String(playerNum ?? option.label.slice(0, 1)))}`}
                            alt={option.label}
                            className="w-9 h-9 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        {/* 내 선택 칩 */}
                        {isMine && (
                          <Badge className="text-[10px] bg-primary-dim text-primary-dark border-0 px-1.5 font-bold flex-shrink-0 pointer-events-none hover:bg-primary-dim">
                            내 선택
                          </Badge>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate">{option.label}</span>
                          {option.description && (
                            <span className="mt-0.5 block line-clamp-2 text-[12px] font-medium leading-snug text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className={cn(
                        'text-sm font-bold tabular-nums flex-shrink-0',
                        isMine ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {percents[i]}%
                      </span>
                    </div>
                    <Progress
                      value={animated ? percents[i] : 0}
                      className={cn(
                        'h-2 transition-all duration-700',
                        !isMine && '[&>div]:bg-disabled'
                      )}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

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
