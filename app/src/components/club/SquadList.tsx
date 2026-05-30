'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PlayerRow, PlayerStatus, Position } from '@/types/database'

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD', 'MGR']

const POSITION_LABEL: Record<Position, string> = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD',
  MGR: 'MANAGER',
}

const STATUS_TABS: Array<{ value: PlayerStatus; label: string }> = [
  { value: 'first_team', label: '1군' },
  { value: 'loan', label: '임대' },
  { value: 'u21', label: 'U21' },
]

function positionEmoji(position: Position): string {
  if (position === 'GK') return 'GK'
  if (position === 'MGR') return 'M'
  return position
}

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  return hasBirthdayPassed ? age : age - 1
}

interface Props {
  players: PlayerRow[]
}

export default function SquadList({ players }: Props) {
  const [activeStatus, setActiveStatus] = useState<PlayerStatus>('first_team')

  const counts = useMemo(() => {
    return STATUS_TABS.reduce<Record<PlayerStatus, number>>((acc, tab) => {
      acc[tab.value] = players.filter(player => player.squad_status === tab.value).length
      return acc
    }, { first_team: 0, loan: 0, u21: 0 })
  }, [players])

  const filteredPlayers = players.filter(player => player.squad_status === activeStatus)
  const grouped = POSITION_ORDER.reduce<Map<Position, PlayerRow[]>>((map, pos) => {
    const group = filteredPlayers.filter(player => player.position === pos)
    if (group.length > 0) map.set(pos, group)
    return map
  }, new Map())

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 mb-3 rounded-xl bg-secondary p-1">
        {STATUS_TABS.map(tab => {
          const isActive = tab.value === activeStatus
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
              className={`h-9 rounded-lg text-[12px] font-bold transition-colors ${
                isActive
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[10px] font-semibold opacity-70">{counts[tab.value]}</span>
            </button>
          )
        })}
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="bg-white border border-border rounded-[20px] px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-foreground">등록된 선수가 없어요.</p>
          <p className="text-[12px] text-muted-foreground mt-1">관리자 페이지에서 상태를 변경해보세요.</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([position, group]) => (
          <div
            key={position}
            className="bg-white border border-border rounded-[20px] overflow-hidden mb-2.5"
          >
            <div className="px-3.5 pt-3 pb-2 border-b border-border">
              <span className="text-[11px] font-extrabold text-primary tracking-widest">
                {POSITION_LABEL[position]}
              </span>
            </div>

            {group.map((player, idx) => {
              const age = calcAge(player.birth_date)
              return (
                <div key={player.id}>
                  {idx > 0 && <div className="h-px bg-border mx-3.5" />}
                  <Link href={`/players/${player.id}`} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-secondary/50 transition-colors">
                    <div className="w-7 flex-shrink-0 text-center">
                      <span className="text-[15px] font-black text-muted-foreground">
                        {player.squad_number ?? '-'}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[12px] font-black text-primary">{positionEmoji(player.position)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground truncate">{player.name}</p>
                      {player.nationality && (
                        <p className="text-[11px] text-muted-foreground">{player.nationality}</p>
                      )}
                    </div>

                    {age != null && (
                      <div className="flex-shrink-0 flex items-baseline gap-0.5">
                        <span className="text-[15px] font-extrabold text-foreground">{age}</span>
                        <span className="text-[10px] text-muted-foreground">세</span>
                      </div>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
