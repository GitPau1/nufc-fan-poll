'use client'

import { useMemo, useState } from 'react'
import { Search, Target } from 'lucide-react'

export type PlayerListItem = {
  id: string
  name: string
  position: string
  meta: string
  rank: number
  overall: number
  photoUrl: string | null
}

type PlayersPageClientProps = {
  players: PlayerListItem[]
}

const positionTone: Record<string, string> = {
  GK: 'bg-[rgba(65,182,230,0.12)] text-primary',
  DEF: 'bg-positive-dim text-positive',
  MID: 'bg-primary-dim text-primary-dark',
  FWD: 'bg-negative-dim text-negative',
  MGR: 'bg-disabled text-gray-2',
}

export function PlayersPageClient({ players }: PlayersPageClientProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filteredPlayers = useMemo(() => {
    if (!normalizedQuery) return players
    return players.filter(player =>
      `${player.name} ${player.position} ${player.meta}`.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, players])
  const pickOnePlayers = players.slice(0, 2)

  return (
    <div className="px-4 pt-4 pb-10 animate-enter">
      {pickOnePlayers.length === 2 && <PickOneSection players={pickOnePlayers} />}

      <div className="mb-3 flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3">
        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="선수 검색"
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-foreground outline-none placeholder:text-gray-3"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-3.5 pb-[9px] pt-3 text-[11px] font-medium tracking-[1.1px] text-gray-3">
          <div className="flex items-center gap-[66px]">
            <span>순위</span>
            <span>이름</span>
          </div>
          <span>오버롤</span>
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredPlayers.map(player => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-20">
            <p className="text-sm font-semibold text-foreground">검색 결과가 없습니다</p>
            <p className="text-xs text-muted-foreground">다른 이름이나 포지션으로 찾아보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PickOneSection({ players }: { players: PlayerListItem[] }) {
  const [left, right] = players

  return (
    <section className="mb-3 overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-3.5 pb-[13px] pt-3">
        <Target className="h-5 w-5 text-foreground" />
        <p className="text-[16px] font-bold leading-6 text-gray-1">Pick One</p>
      </div>

      <div className="px-4 pt-4">
        <p className="text-[12px] leading-[16.5px] text-gray-2">
          여러분의 선택이 오버롤에 반영됩니다
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-3">
        <PickOneCard player={left} />
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill bg-disabled text-[12px] font-medium text-gray-3">
          vs
        </div>
        <PickOneCard player={right} />
      </div>

      <div className="px-3.5 pb-1">
        <PickOneResult player={left} rank={1} />
        <div className="h-px bg-border" />
        <PickOneResult player={right} rank={2} />
      </div>
    </section>
  )
}

function PickOneCard({ player }: { player: PlayerListItem }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg bg-[radial-gradient(circle_at_80%_-20%,#5d6676_0%,#2e2d2d_50%,#191a1b_100%)] p-3">
      <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-pill border border-border bg-surface">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] font-semibold text-primary">{player.position}</span>
        )}
      </div>
      <p className="truncate text-[14px] font-semibold leading-[21px] text-white">
        {player.name}
      </p>
      <div className="flex items-center gap-3 text-[11px] leading-[16.5px] text-[#ebebeb]">
        <span>{player.position}</span>
        <span className="truncate">{player.meta}</span>
      </div>
    </div>
  )
}

function PickOneResult({ player, rank }: { player: PlayerListItem; rank: number }) {
  return (
    <div className="flex items-center gap-2.5 py-3">
      <div className="w-6 text-center text-[12px] font-medium leading-[22.5px] text-gray-2">
        {rank}
      </div>
      <p className="min-w-0 flex-1 truncate text-[12px] font-medium leading-[21px] text-foreground">
        {player.name}
      </p>
      <div className="w-8 text-right text-[12px] font-medium leading-[22.5px] text-gray-2">
        {player.overall}점
      </div>
    </div>
  )
}

function PlayerRow({ player }: { player: PlayerListItem }) {
  const tone = positionTone[player.position] ?? 'bg-disabled text-gray-2'

  return (
    <div className="flex h-[68px] items-center gap-2.5 px-3.5 py-2.5">
      <div className="relative h-6 w-6 flex-shrink-0">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-semibold leading-[22.5px] text-gray-2">
          {player.rank}
        </span>
      </div>

      <div className={`flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center overflow-hidden rounded-pill ${player.photoUrl ? 'bg-disabled' : tone}`}>
        {player.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] font-medium leading-[18px]">{player.position}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-[21px] text-foreground">
          {player.name}
        </p>
        <div className="flex items-center gap-3 text-[11px] leading-[16.5px] text-gray-2">
          <span>{player.position}</span>
          <span className="truncate">{player.meta}</span>
        </div>
      </div>

      <div className="w-8 flex-shrink-0 text-center text-[16px] font-semibold leading-[22.5px] text-foreground">
        {player.overall}
      </div>
    </div>
  )
}
