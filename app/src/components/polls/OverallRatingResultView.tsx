'use client'

import { useEffect, useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import type { PollDetail, RatingResultItem } from '@/lib/queries/polls'
import { toggleRatingCommentLike } from '@/lib/actions/ratings'
import { trackEvent } from '@/lib/analytics/mixpanel'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PollPageHeader } from './PollPageHeader'

const POSITION_GROUPS = [
  { value: 'GK', label: '골키퍼' },
  { value: 'DEF', label: '수비수' },
  { value: 'MID', label: '미드필더' },
  { value: 'FWD', label: '공격수' },
] as const

interface OverallRatingResultViewProps {
  poll: PollDetail
  results: RatingResultItem[]
  hasVoted: boolean
}

export function OverallRatingResultView({ poll, results, hasVoted }: OverallRatingResultViewProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const coverUrl = poll.thumbnail_url
    ?? `https://placehold.co/480x160/0c2340/41b6e6?text=${encodeURIComponent(poll.title.slice(0, 4))}`
  const groupedResults = POSITION_GROUPS
    .map(group => ({
      ...group,
      results: results.filter(result => result.player.position === group.value),
    }))
    .filter(group => group.results.length > 0)

  useEffect(() => {
    trackEvent('poll_result_viewed', {
      source_page: 'poll_detail',
      poll_id: poll.id,
      poll_type: poll.type,
      poll_status: poll.status,
      creator_type: poll.created_by && poll.creator_name ? 'user' : 'admin',
      has_voted: hasVoted,
      total_votes: results.reduce((sum, result) => sum + result.vote_count, 0),
    })
  }, [hasVoted, poll.created_by, poll.creator_name, poll.id, poll.status, poll.type, results])

  return (
    <div className="flex min-h-screen flex-col">
      <PollPageHeader />

      <div className="flex-1 overflow-y-auto pb-8 animate-enter">
        <div className="relative h-[160px] overflow-hidden">
          <img src={coverUrl} alt={poll.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/45 to-black/85" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Badge className="border-0 bg-white/20 text-[11px] font-semibold text-white backdrop-blur-sm pointer-events-none">전체 평가</Badge>
              {hasVoted && (
                <Badge className="border-0 bg-primary text-[11px] font-semibold text-white hover:bg-primary pointer-events-none">평가 완료</Badge>
              )}
            </div>
            <div className="flex items-end justify-between gap-3">
              <h1 className="min-w-0 flex-1 text-[18px] font-black leading-tight text-white">{poll.title}</h1>
              {poll.creator_name && (
                <span className="max-w-[38%] truncate text-right text-[12px] font-bold text-white/80">{poll.creator_name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {poll.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{poll.description}</p>
          )}

          {groupedResults.map(group => (
            <section key={group.value} className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    {group.value}
                  </p>
                  <h2 className="text-base font-black text-foreground">{group.label}</h2>
                </div>
                <p className="text-[12px] font-semibold text-muted-foreground">
                  {group.results.length}명
                </p>
              </div>

              <div className="space-y-3">
                {group.results.map(result => {
                  const visibleComments = expandedPlayerId === result.player.id
                    ? result.top_comments
                    : result.top_comments.slice(0, 3)

                  return (
                    <Card key={result.player.id}>
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={result.player.photo_url ?? `https://placehold.co/52x52/0c2340/41b6e6?text=${result.player.squad_number ?? result.player.name.slice(0, 1)}`}
                            alt={result.player.name}
                            className="h-13 w-13 h-[52px] w-[52px] rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-foreground">{result.player.name}</p>
                            <p className="text-xs text-muted-foreground">{result.player.position} · #{result.player.squad_number ?? '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary">{result.grade}</p>
                            <p className="text-[11px] font-semibold text-muted-foreground">
                              평균 {result.average_score.toFixed(1)} · {result.vote_count}명
                            </p>
                          </div>
                        </div>

                        {visibleComments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">팬 코멘트</p>
                            {visibleComments.map(comment => (
                              <div key={comment.id} className="rounded-xl bg-secondary/70 px-3 py-2.5">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-muted-foreground">
                                    {comment.user.display_name ?? '뉴캐슬 팬'} · {comment.grade}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => startTransition(async () => {
                                      if (!comment.is_liked) {
                                        trackEvent('comment_liked', {
                                          source_page: 'poll_detail',
                                          poll_id: poll.id,
                                          poll_type: poll.type,
                                          poll_status: poll.status,
                                          creator_type: poll.created_by && poll.creator_name ? 'user' : 'admin',
                                          comment_id: comment.id,
                                        })
                                      }
                                      await toggleRatingCommentLike(comment.id, poll.id)
                                    })}
                                    className={cn(
                                      'flex items-center gap-1 text-[11px] font-bold',
                                      comment.is_liked ? 'text-primary' : 'text-muted-foreground'
                                    )}
                                  >
                                    <Heart className={cn('h-3.5 w-3.5', comment.is_liked && 'fill-current')} />
                                    {comment.like_count}
                                  </button>
                                </div>
                                <p className="text-[13px] leading-relaxed text-foreground">{comment.comment}</p>
                              </div>
                            ))}
                            {result.top_comments.length > 3 && expandedPlayerId !== result.player.id && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 w-full rounded-lg text-[12px] font-bold"
                                onClick={() => setExpandedPlayerId(result.player.id)}
                              >
                                전체 코멘트 보기
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
