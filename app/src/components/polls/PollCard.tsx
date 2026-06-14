'use client'

import Link from 'next/link'
import { Clock, Lock, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { PollListItem } from '@/lib/queries/polls'
import { getSourcePage, trackEvent } from '@/lib/analytics/mixpanel'
import { getEffectivePollStatus } from '@/lib/polls/status'
import { formatScheduled } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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
  if (type === 'free_choice') return '자유 선택'
  if (type === 'subject_options' || type === 'evaluation') return '평가'
  return '선택'
}

function getStatusLabel(poll: PollListItem): string {
  if (poll.status === 'scheduled') return poll.scheduled_at ? formatScheduled(poll.scheduled_at) : '공개 예정'
  if (poll.status === 'closed') return '종료됨'
  return '진행중'
}

function formatTimeLeft(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now()
  if (diff <= 0) return '마감 임박'
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}일 남음`
  if (hours > 0) return `${hours}시간 남음`
  return `${Math.max(1, Math.floor(diff / 60_000))}분 남음`
}

function getOptionPreview(poll: PollListItem): string {
  if (poll.poll_options.length === 0) return '후보 공개 전'
  const preview = poll.poll_options
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 3)
    .map(option => option.label)
    .join(' · ')
  const rest = poll.poll_options.length - 3
  return rest > 0 ? `${preview} 외 ${rest}개` : preview
}

// ── 피드형 투표 카드 ───────────────────────────────────────
function PollFeedCard({ poll }: { poll: PollListItem }) {
  const isActive = poll.status === 'active'
  const isScheduled = poll.status === 'scheduled'
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
      className={`block overflow-hidden rounded-md border border-border bg-surface shadow-g200 active:bg-disabled transition-colors ${poll.status === 'closed' ? 'opacity-75' : ''}`}
    >
      <div className="px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-semibold pointer-events-none">
            {getPollTypeLabel(poll.type)}
          </Badge>
          <Badge className="text-[10px] font-semibold bg-primary-dim text-primary-dark border-0 hover:bg-primary-dim pointer-events-none">
            {getStatusLabel(poll)}
          </Badge>
        </div>

        <p className="line-clamp-2 text-[18px] font-black leading-snug tracking-tight text-foreground">{poll.title}</p>
        {poll.description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{poll.description}</p>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="overflow-hidden rounded-md bg-disabled">
          <img
            src={getThumbnailUrl(poll)}
            alt={poll.title}
            className={`aspect-[16/9] w-full object-cover ${isScheduled ? 'scale-105 blur-sm' : ''} ${poll.status === 'closed' ? 'grayscale-[.35]' : ''}`}
          />
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="line-clamp-1 text-[12px] font-semibold text-muted-foreground">{getOptionPreview(poll)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
          {poll.creator_name && <span>{poll.creator_name}</span>}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {poll.vote_count.toLocaleString()}명 참여
          </span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 text-primary-dark">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeLeft(poll.closes_at)}
            </span>
          ) : poll.status === 'closed' ? (
            <span>최종 결과 보기</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              공개 전
            </span>
          )}
        </div>
        {isActive && (
          <div className="mt-2 inline-flex text-[11px] font-bold text-primary">
            결과는 참여 후 공개
          </div>
        )}
      </div>
    </Link>
  )
}

// ── export ────────────────────────────────────────────────────
export function PollCard({ poll }: PollCardProps) {
  const effectivePoll = {
    ...poll,
    status: getEffectivePollStatus(poll),
  }
  return <PollFeedCard poll={effectivePoll} />
}
