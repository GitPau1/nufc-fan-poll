import type { ClubStatusWithStats, PlayerRow } from '@/types/database'

interface StatCardProps {
  label: string
  player: Pick<PlayerRow, 'name' | 'photo_url'> | null
  count: number | null
  unit: string
  emoji: string
}

function StatCard({ label, player, count, unit, emoji }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-[20px] py-3 px-2.5 text-center">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <div className="w-10 h-10 rounded-full bg-primary/10 mx-auto mb-1.5 flex items-center justify-center overflow-hidden">
        {player?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl">{emoji}</span>
        )}
      </div>
      <p className="text-[12px] font-extrabold text-foreground line-clamp-1">
        {player ? (player.name.split(' ').slice(-1)[0]) : '—'}
      </p>
      <p className="text-[18px] font-black text-primary">{count ?? '—'}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{unit}</p>
    </div>
  )
}

interface Props {
  status: ClubStatusWithStats | null
}

export default function SeasonStats({ status }: Props) {
  if (!status) return null

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      <StatCard
        label="최다 출전"
        player={status.top_appearances_player}
        count={status.top_appearances_count}
        unit="경기"
        emoji="🧤"
      />
      <StatCard
        label="최다 득점"
        player={status.top_goals_player}
        count={status.top_goals_count}
        unit="골"
        emoji="⚽"
      />
      <StatCard
        label="최다 어시"
        player={status.top_assists_player}
        count={status.top_assists_count}
        unit="어시스트"
        emoji="🎯"
      />
    </div>
  )
}
