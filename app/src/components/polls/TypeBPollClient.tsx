'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import type { PollDetail } from '@/lib/queries/polls'
import type { PlayerRow } from '@/types/database'
import { submitVote } from '@/lib/actions/vote'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from './ConfirmModal'
import { LoginModal } from './LoginModal'
import { PollPageHeader } from './PollPageHeader'

interface TypeBPollClientProps {
  poll: PollDetail
  isAuthenticated: boolean
}

const CARD_W  = 200  // 센터 카드 px
const SIDE_SCALE = 0.83

export function TypeBPollClient({ poll, isAuthenticated }: TypeBPollClientProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showLogin, setShowLogin]     = useState(false)
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const router                        = useRouter()

  const options = poll.poll_options
  const selectedOption = options[selectedIdx]

  function prev() { setSelectedIdx(i => Math.max(0, i - 1)) }
  function next() { setSelectedIdx(i => Math.min(options.length - 1, i + 1)) }

  function handleSubmit() {
    if (!isAuthenticated) { setShowLogin(true); return }
    setShowConfirm(true)
  }

  function handleConfirm() {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await submitVote(poll.id, selectedOption.id)
      if ('success' in result) {
        setShowConfirm(false)
        router.refresh()
      } else {
        setShowConfirm(false)
        setErrorMsg(
          result.error === 'already_voted'
            ? '이미 참여한 투표입니다'
            : '제출에 실패했습니다. 다시 시도해주세요'
        )
      }
    })
  }

  const daysLeft = Math.ceil(
    (new Date(poll.closes_at).getTime() - Date.now()) / 86400000
  )

  const coverUrl = poll.thumbnail_url
    ?? poll.player?.photo_url
    ?? `https://placehold.co/480x160/0c2340/41b6e6?text=${encodeURIComponent(poll.title.slice(0, 4))}`

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* 페이지 헤더 */}
      <PollPageHeader />

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-[88px] animate-enter">

        {/* 커버 이미지 — 칩 → 제목 순서로 오버레이 */}
        <div className="relative h-[160px] overflow-hidden">
          <img src={coverUrl} alt={poll.title} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 50%, rgba(0,0,0,.85) 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px] font-semibold pointer-events-none">
                선택
              </Badge>
              {daysLeft > 0 ? (
                <Badge className="bg-primary text-white border-0 text-[11px] font-semibold hover:bg-primary pointer-events-none">
                  D-{daysLeft} 마감
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[11px] font-semibold pointer-events-none">
                  마감
                </Badge>
              )}
            </div>
            <h1 className="text-[18px] font-black text-white leading-tight">{poll.title}</h1>
          </div>
        </div>

        {/* 설명 + 에러 */}
        {(poll.description || errorMsg) && (
          <div className="px-4 pt-4 pb-0 flex flex-col gap-2">
            {poll.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{poll.description}</p>
            )}
            {errorMsg && (
              <p className="text-sm text-destructive font-medium">{errorMsg}</p>
            )}
          </div>
        )}

        {/* 캐러셀 */}
        <div
          className="relative h-[260px] overflow-hidden mt-4"
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStartX === null) return
            const dx = e.changedTouches[0].clientX - touchStartX
            if (dx > 50) prev()
            else if (dx < -50) next()
            setTouchStartX(null)
          }}
        >
          {options.map((option, i) => {
            const pos      = i - selectedIdx
            const isCenter = pos === 0
            const absPOS   = Math.abs(pos)

            // ±2 까지 렌더 유지 (팝인 방지), 그 이상은 제거
            if (absPOS > 2) return null

            const gap  = 16
            const step = CARD_W * ((1 + SIDE_SCALE) / 2) + gap
            const x    = pos * step
            const player: PlayerRow | null =
              option.player_id && poll.option_players
                ? poll.option_players[option.player_id] ?? null
                : null

            const thumbUrl = player?.photo_url
              ?? `https://placehold.co/${CARD_W}x260/0c2340/41b6e6?text=${encodeURIComponent(option.label.slice(0, 2))}`

            // ±2 카드는 투명하게 대기 (위치는 유지해 transition smooth)
            const opacity      = absPOS >= 2 ? 0 : isCenter ? 1 : 0.5
            const zIdx         = isCenter ? 10 : absPOS === 1 ? 5 : 1
            const isInteractive = isCenter || absPOS === 1

            return (
              <button
                key={option.id}
                onClick={() => !isCenter && isInteractive && setSelectedIdx(i)}
                className={cn(
                  'absolute top-0 h-full rounded-2xl overflow-hidden',
                  'transition-all duration-300 ease-out',
                  isCenter ? 'cursor-default' : 'cursor-pointer'
                )}
                style={{
                  width:         CARD_W,
                  left:          `calc(50% - ${CARD_W / 2}px + ${x}px)`,
                  transform:     `scale(${isCenter ? 1 : SIDE_SCALE})`,
                  opacity,
                  zIndex:        zIdx,
                  pointerEvents: isInteractive ? 'auto' : 'none',
                }}
              >
                {/* 선수 사진 */}
                <img
                  src={thumbUrl}
                  alt={option.label}
                  className="w-full h-full object-cover"
                />
                {/* 그라디언트 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {/* 선수 정보 */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-black text-base leading-tight">
                    {option.label}
                  </p>
                  {player && (
                    <p className="text-white/70 text-xs mt-0.5">
                      {player.position} · #{player.squad_number}
                    </p>
                  )}
                </div>
                {/* 선택 인디케이터: inset ring (overflow-hidden에 클리핑 안 됨) */}
                {isCenter && (
                  <>
                    <div className="absolute inset-0 rounded-2xl ring-inset ring-[3px] ring-primary pointer-events-none" />
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* 네비게이션 컨트롤 */}
        <div className="flex items-center justify-center gap-4 mt-4 px-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={prev}
            disabled={selectedIdx === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 도트 인디케이터 */}
          <div className="flex items-center gap-1.5">
            {options.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === selectedIdx
                    ? 'w-5 h-2 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={next}
            disabled={selectedIdx === options.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 선택된 선수 요약 */}
        <div className="mx-4 mt-4 rounded-xl bg-secondary px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5">현재 선택</p>
          <p className="text-sm font-bold text-foreground">{selectedOption?.label}</p>
        </div>
      </div>

      {/* 하단 고정 제출 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-white/95 backdrop-blur border-t z-30">
        <Button
          className="w-full h-12 text-sm font-bold rounded-xl"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />제출 중…</>
            : '투표하기'
          }
        </Button>
      </div>

      <ConfirmModal
        open={showConfirm}
        selectedLabel={selectedOption?.label ?? ''}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </div>
  )
}
