import Link from 'next/link'
import { Lock, Users } from 'lucide-react'
import type { PollListItem } from '@/lib/queries/polls'
import { formatScheduled } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CountdownTimer } from './CountdownTimer'

interface PollCardProps {
  poll: PollListItem
}

function getThumbnailUrl(poll: PollListItem): string {
  if (poll.thumbnail_url) return poll.thumbnail_url
  if (poll.player?.photo_url) return poll.player.photo_url
  const optionImage = poll.poll_options.find(option => option.image_url)?.image_url
  if (optionImage) return optionImage
  return `https://placehold.co/96x96/0c2340/41b6e6?text=${encodeURIComponent(poll.title.slice(0, 2))}`
}

function getPollTypeLabel(type: PollListItem['type']): string {
  if (type === 'overall_rating') return '전체 평가'
  if (type === 'free_choice') return '자유 선택'
  if (type === 'subject_options' || type === 'evaluation') return '평가'
  return '선택'
}

// ── 활성 / 마감 카드 ──────────────────────────────────────────
function ActiveCard({ poll }: { poll: PollListItem }) {
  const isActive = poll.status === 'active'

  return (
    <Link href={`/polls/${poll.id}`} className="block active:scale-[0.98] transition-transform duration-100">
      <Card className={`rounded-2xl hover:shadow-md transition-shadow duration-200 cursor-pointer ${!isActive ? 'opacity-60' : ''}`}>
        <div className="flex gap-3.5 p-3.5 items-start">
          {/* 정사각형 썸네일 */}
          <div className="w-[96px] h-[96px] flex-shrink-0 rounded-xl overflow-hidden bg-muted">
            <img
              src={getThumbnailUrl(poll)}
              alt={poll.title}
              className={`w-full h-full object-cover ${!isActive ? 'grayscale-[.4]' : ''}`}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5" style={{ minHeight: 96 }}>
            <div>
              {/* 배지 */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-[10px] font-semibold pointer-events-none">
                  {getPollTypeLabel(poll.type)}
                </Badge>
                {isActive && (
                  <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-0 hover:bg-primary/10 pointer-events-none">
                    <CountdownTimer closesAt={poll.closes_at} />
                  </Badge>
                )}
                {!isActive && (
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground pointer-events-none">
                    종료
                  </Badge>
                )}
              </div>
              {/* 제목 */}
              <p className="text-[15px] font-bold text-foreground leading-snug line-clamp-2 mt-0.5">
                {poll.title}
              </p>
              {poll.description && (
                <p className="text-[12px] text-muted-foreground leading-snug line-clamp-1 mt-1">
                  {poll.description}
                </p>
              )}
            </div>

            {/* 하단 정보 */}
            <div className="flex items-center gap-1.5 text-[11px] leading-none text-muted-foreground mt-2">
              <Users className="h-3.5 w-3.5" />
              <span>
                {isActive
                  ? `${poll.vote_count.toLocaleString()}명 참여`
                  : '결과 열람 가능'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ── 공개 예정 카드 (blur overlay) ─────────────────────────────
function ScheduledCard({ poll }: { poll: PollListItem }) {
  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="relative flex gap-3 p-3 items-start">
        {/* 블러 처리된 썸네일 */}
        <div className="w-[96px] h-[96px] flex-shrink-0 rounded-xl overflow-hidden bg-muted">
          <img
            src={getThumbnailUrl(poll)}
            alt=""
            className="w-full h-full object-cover blur-sm scale-105"
          />
        </div>

        {/* 블러 처리된 텍스트 영역 */}
        <div className="flex-1 flex flex-col gap-2 blur-[2px] pointer-events-none select-none py-0.5">
          <div className="h-4 w-10 rounded bg-muted" />
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted mt-auto" />
        </div>

        {/* 오버레이 */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground line-clamp-1 px-4 text-center">
            {poll.title}
          </p>
          <p className="text-[11px] font-medium text-primary">
            {poll.scheduled_at ? formatScheduled(poll.scheduled_at) : '공개 예정'}
          </p>
        </div>
      </div>
    </Card>
  )
}

// ── export ────────────────────────────────────────────────────
export function PollCard({ poll }: PollCardProps) {
  if (poll.status === 'scheduled') return <ScheduledCard poll={poll} />
  return <ActiveCard poll={poll} />
}
