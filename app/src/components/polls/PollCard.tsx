'use client'

import Link from 'next/link'
import { ChevronRight, Lock, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { PollListItem } from '@/lib/queries/polls'
import { getSourcePage, trackEvent } from '@/lib/analytics/mixpanel'
import { getEffectivePollStatus } from '@/lib/polls/status'
import { formatScheduled } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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

// ── 목록형 투표 아이템 ───────────────────────────────────────
function PollListRow({ poll }: { poll: PollListItem }) {
  const isActive = poll.status === 'active'
  const pathname = usePathname()

  return (
    <Link
      href={`/polls/${poll.id}`}
      onClick={() => trackEvent('poll_card_clicked', {
        source_page: getSourcePage(pathname),
        poll_id: poll.id,
        poll_type: poll.type,
        poll_status: poll.status,
        creator_type: poll.created_by && poll.creator_name ? 'user' : 'admin',
      })}
      className={`block border-b border-border bg-white px-4 py-4 active:bg-secondary/60 transition-colors ${!isActive ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={getThumbnailUrl(poll)}
            alt={poll.title}
            className={`h-full w-full object-cover ${!isActive ? 'grayscale-[.4]' : ''}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-semibold pointer-events-none">
              {getPollTypeLabel(poll.type)}
            </Badge>
            {isActive ? (
              <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-0 hover:bg-primary/10 pointer-events-none">
                <CountdownTimer closesAt={poll.closes_at} />
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground pointer-events-none">
                종료
              </Badge>
            )}
          </div>
          <p className="line-clamp-1 text-[15px] font-black leading-snug text-foreground">{poll.title}</p>
          {poll.description && (
            <p className="mt-1 line-clamp-1 text-[12px] leading-snug text-muted-foreground">{poll.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-none text-muted-foreground">
            {poll.creator_name && <span>{poll.creator_name}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {isActive ? `${poll.vote_count.toLocaleString()}명 참여` : '결과 열람 가능'}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </div>
    </Link>
  )
}

function ScheduledRow({ poll }: { poll: PollListItem }) {
  return (
    <div className="border-b border-border bg-white px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={getThumbnailUrl(poll)}
            alt=""
            className="h-full w-full scale-105 object-cover blur-sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-semibold pointer-events-none">
              {getPollTypeLabel(poll.type)}
            </Badge>
            <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-0 hover:bg-primary/10 pointer-events-none">
              {poll.scheduled_at ? formatScheduled(poll.scheduled_at) : '공개 예정'}
            </Badge>
          </div>
          <p className="line-clamp-1 text-[15px] font-black text-foreground">{poll.title}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-muted-foreground">
            {poll.creator_name && <span>{poll.creator_name}</span>}
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> 공개 전</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── export ────────────────────────────────────────────────────
export function PollCard({ poll }: PollCardProps) {
  const effectivePoll = {
    ...poll,
    status: getEffectivePollStatus(poll),
  }
  if (effectivePoll.status === 'scheduled') return <ScheduledRow poll={effectivePoll} />
  return <PollListRow poll={effectivePoll} />
}
