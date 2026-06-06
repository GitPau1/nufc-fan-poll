'use client'

import { useState } from 'react'
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

  const filteredPlayers = players.filter(player => player.squad_status === activeStatus)
  const grouped = POSITION_ORDER.reduce<Map<Position, PlayerRow[]>>((map, pos) => {
    const group = filteredPlayers.filter(player => player.position === pos)
    if (group.length > 0) map.set(pos, group)
    return map
  }, new Map())

  return (
    <div>
      <div className="mb-3 flex min-w-0 gap-4 overflow-x-auto border-b border-border">
        {STATUS_TABS.map(tab => {
          const isActive = tab.value === activeStatus
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
              className={`relative h-11 shrink-0 text-[14px] font-black transition-opacity hover:opacity-70 active:opacity-50 ${
                isActive
                  ? 'text-primary-dark'
                  : 'text-muted-foreground'
              }`}
            >
              {tab.label}
              {isActive && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="bg-surface border border-border rounded-md px-4 py-8 text-center shadow-g200">
          <p className="text-[13px] font-semibold text-foreground">등록된 선수가 없어요.</p>
          <p className="text-[12px] text-muted-foreground mt-1">관리자 페이지에서 상태를 변경해보세요.</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([position, group]) => (
          <div
            key={position}
            className="bg-surface border border-border rounded-md overflow-hidden mb-2.5 shadow-g200"
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
                  <Link href={`/players/${player.id}`} prefetch={false} className="flex items-center gap-2.5 px-3.5 py-2.5 transition-opacity hover:opacity-70 active:opacity-50">
                    <div className="w-7 flex-shrink-0 text-center">
                      <span className="text-[15px] font-black text-muted-foreground">
                        {player.squad_number ?? '-'}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-primary-dim flex-shrink-0 flex items-center justify-center overflow-hidden">
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
