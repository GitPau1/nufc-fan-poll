import type { PlayerRow, Position } from '@/types/database'
import { calcAge } from '@/lib/queries/club'

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD', 'MGR']

const POSITION_LABEL: Record<Position, string> = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD',
  MGR: 'MANAGER',
}

function positionEmoji(position: Position): string {
  if (position === 'GK') return '🧤'
  if (position === 'MGR') return '🧥'
  return '⚽'
}

interface Props {
  players: PlayerRow[]
}

export default function SquadList({ players }: Props) {
  const grouped = POSITION_ORDER.reduce<Map<Position, PlayerRow[]>>((map, pos) => {
    const group = players.filter((p) => p.position === pos)
    if (group.length > 0) map.set(pos, group)
    return map
  }, new Map())

  return (
    <div>
      {Array.from(grouped.entries()).map(([position, group]) => (
        <div
          key={position}
          className="bg-white border border-border rounded-[20px] overflow-hidden mb-2.5"
        >
          {/* Position header */}
          <div className="px-3.5 pt-3 pb-2 border-b border-border">
            <span className="text-[11px] font-extrabold text-primary tracking-widest">
              {POSITION_LABEL[position]}
            </span>
          </div>

          {/* Player rows */}
          {group.map((player, idx) => {
            const age = calcAge(player.birth_date)
            return (
              <div key={player.id}>
                {idx > 0 && <div className="h-px bg-border mx-3.5" />}
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  {/* Squad number */}
                  <div className="w-7 flex-shrink-0 text-center">
                    <span className="text-[15px] font-black text-muted-foreground">
                      {player.squad_number ?? '—'}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {player.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">{positionEmoji(player.position)}</span>
                    )}
                  </div>

                  {/* Name + nationality */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{player.name}</p>
                    {player.nationality && (
                      <p className="text-[11px] text-muted-foreground">{player.nationality}</p>
                    )}
                  </div>

                  {/* Age */}
                  {age != null && (
                    <div className="flex-shrink-0 flex items-baseline gap-0.5">
                      <span className="text-[15px] font-extrabold text-foreground">{age}</span>
                      <span className="text-[10px] text-muted-foreground">세</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
