import type { ClubStatusWithStats } from '@/types/database'

interface Props {
  status: ClubStatusWithStats | null
}

export default function ClubStatusCard({ status }: Props) {
  if (!status) return null

  const venueLabel = status.next_match_venue === 'home' ? '홈' : '원정'
  // next_match_date는 text 컬럼 — 그대로 표시 (ISO 파싱 시도 안 함)
  const matchDate = status.next_match_date ?? null

  return (
    <div
      className="mb-3 overflow-hidden rounded-lg shadow-g200"
      style={{ background: 'linear-gradient(135deg, #0c2340 0%, #1a3a60 100%)' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="text-primary text-[11px] font-bold uppercase tracking-wide">
            구단 현황 · 2025–26 시즌
          </span>
        </div>

        {/* Sub-cards row */}
        <div className="flex gap-2">
          {/* 순위 card */}
          <div
            className="flex-shrink-0 rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              리그 순위
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-black" style={{ fontSize: 28 }}>
                {status.league_rank ?? '—'}
              </span>
              {status.league_rank != null && (
                <span className="text-white" style={{ fontSize: 16 }}>
                  위
                </span>
              )}
            </div>
            <span className="text-primary text-[10px] font-semibold">PL</span>
          </div>

          {/* 다음 경기 card */}
          {status.next_match_opponent && (
            <div
              className="flex-1 rounded-lg px-3 py-2.5 flex flex-col gap-0.5"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                다음 경기
              </span>
              <span className="text-white text-[15px] font-extrabold">
                vs {status.next_match_opponent}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {matchDate && (
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {matchDate}
                  </span>
                )}
                {status.next_match_venue && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(65,182,230,0.25)',
                      color: '#41b6e6',
                    }}
                  >
                    {venueLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
