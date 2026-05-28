'use client'

import { useMemo, useState } from 'react'
import type { PlayerRow, PlayerStatus, Position } from '@/types/database'
import type { FarewellItem } from '@/lib/queries/farewells'

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
  if (position === 'GK') return '🧤'
  if (position === 'MGR') return '🧥'
  return '⚽'
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
  farewells?: FarewellItem[]
}

function getFarewellSeason(leftAt: string | null): string {
  if (!leftAt) return '시즌 미정'
  const date = new Date(leftAt)
  const year = date.getFullYear()
  const seasonStart = date.getMonth() >= 6 ? year : year - 1
  return `${seasonStart}-${String(seasonStart + 1).slice(2)}`
}

export default function SquadList({ players, farewells = [] }: Props) {
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
  const farewellGroups = useMemo(() => {
    return farewells.reduce<Map<string, FarewellItem[]>>((map, farewell) => {
      const season = getFarewellSeason(farewell.left_at)
      const group = map.get(season) ?? []
      group.push(farewell)
      map.set(season, group)
      return map
    }, new Map())
  }, [farewells])

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
          <p className="text-[13px] font-semibold text-foreground">등록된 선수가 없어요</p>
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
                  <div className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="w-7 flex-shrink-0 text-center">
                      <span className="text-[15px] font-black text-muted-foreground">
                        {player.squad_number ?? '-'}
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
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
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}

      {farewells.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-extrabold text-foreground tracking-tight">작별 선수</p>
            <span className="text-[11px] text-muted-foreground">{farewells.length}명</span>
          </div>

          {Array.from(farewellGroups.entries()).map(([season, group]) => (
            <div key={season} className="bg-white border border-border rounded-[20px] overflow-hidden mb-2.5">
              <div className="px-3.5 pt-3 pb-2 border-b border-border">
                <span className="text-[11px] font-extrabold text-primary tracking-widest">
                  {season}
                </span>
              </div>

              {group.map((farewell, idx) => {
                const player = farewell.player
                return (
                  <div key={farewell.id}>
                    {idx > 0 && <div className="h-px bg-border mx-3.5" />}
                    <div className="flex items-center gap-3 px-3.5 py-2.5">
                      <div className="w-7 flex-shrink-0 text-center">
                        <span className="text-[15px] font-black text-muted-foreground">
                          {player?.squad_number ?? '-'}
                        </span>
                      </div>

                      <div className="w-14 h-14 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {player?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[13px] font-black text-primary">
                            {player?.name.slice(0, 1) ?? '작'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-foreground truncate">
                          {player?.name ?? '선수 정보 없음'}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {farewell.destination_club || '행선지 미정'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
