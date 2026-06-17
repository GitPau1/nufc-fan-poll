'use client'

import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export type PlayerListItem = {
  id: string
  name: string
  position: string
  meta: string
  rank: number
  overall: number
  photoUrl: string | null
  seasons: string
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
      `${player.name} ${player.position} ${player.meta} ${player.seasons}`.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, players])

  return (
    <div className="px-4 pt-4 pb-10 animate-enter">
      {players.length >= 2 && <PickOneSection players={players} />}

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

type PickOnePhase = 'idle' | 'confirming' | 'centered'
type PickOneCardKey = 'leftCard' | 'rightCard'
type PickOneSlot = 'left' | 'right' | 'center' | 'out-left' | 'out-right' | 'enter-right'
type PickOneCardState = {
  player: PlayerListItem
  slot: PickOneSlot
}

const slotClass: Record<PickOneSlot, string> = {
  left: 'translate-x-[12.5px]',
  right: 'translate-x-[255px]',
  center: 'translate-x-[134.75px]',
  'out-left': '-translate-x-[210px] opacity-0',
  'out-right': 'translate-x-[480px] opacity-0',
  'enter-right': 'translate-x-[480px] opacity-0',
}

function PickOneSection({ players }: { players: PlayerListItem[] }) {
  const initialPlayers = useMemo(() => getInitialMatchup(players), [players])
  const [phase, setPhase] = useState<PickOnePhase>('idle')
  const [selectedCardKey, setSelectedCardKey] = useState<PickOneCardKey | null>(null)
  const [cards, setCards] = useState<Record<PickOneCardKey, PickOneCardState>>(() => ({
    leftCard: { player: initialPlayers[0], slot: 'left' },
    rightCard: { player: initialPlayers[1], slot: 'right' },
  }))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function selectCard(cardKey: PickOneCardKey) {
    if (phase !== 'idle') return

    const otherKey: PickOneCardKey = cardKey === 'leftCard' ? 'rightCard' : 'leftCard'
    setSelectedCardKey(cardKey)
    setPhase('confirming')

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCards(current => ({
        ...current,
        [cardKey]: { ...current[cardKey], slot: 'center' },
        [otherKey]: {
          ...current[otherKey],
          slot: current[otherKey].slot === 'left' ? 'out-left' : 'out-right',
        },
      }))
      setPhase('centered')
    }, 1000)
  }

  function showNextMatchup() {
    if (phase !== 'centered' || !selectedCardKey) return

    const winner = cards[selectedCardKey].player
    const otherKey: PickOneCardKey = selectedCardKey === 'leftCard' ? 'rightCard' : 'leftCard'
    const nextOpponent = getNextOpponent(players, winner, cards[otherKey].player)

    setSelectedCardKey(null)
    setPhase('idle')
    setCards({
      [selectedCardKey]: { player: winner, slot: 'left' },
      [otherKey]: { player: nextOpponent, slot: 'enter-right' },
    } as Record<PickOneCardKey, PickOneCardState>)

    requestAnimationFrame(() => {
      window.setTimeout(() => {
        setCards(current => ({
          ...current,
          [otherKey]: { ...current[otherKey], slot: 'right' },
        }))
      }, 120)
    })
  }

  return (
    <section className="mb-3 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex justify-center border-b border-border px-3.5 pb-[13px] pt-3">
        <p className="whitespace-nowrap text-[16px] font-bold leading-6 tracking-[-0.4px] text-gray-1">
          여러분의 선택은?
        </p>
      </div>

      <div className="relative h-[168px] overflow-hidden">
        <PickOneCard
          key={cards.leftCard.player.id}
          card={cards.leftCard}
          isPicked={selectedCardKey === 'leftCard'}
          isDimmed={phase === 'confirming' && selectedCardKey === 'rightCard'}
          onClick={() => phase === 'centered' ? showNextMatchup() : selectCard('leftCard')}
        />
        <div className={`absolute left-[211px] top-[72px] flex h-6 w-6 items-center justify-center rounded-pill bg-[#f5f5f6] text-[14px] font-medium leading-[23px] tracking-[-0.4px] text-[#ababab] transition-opacity duration-300 ${phase === 'centered' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
          vs
        </div>
        <PickOneCard
          key={cards.rightCard.player.id}
          card={cards.rightCard}
          isPicked={selectedCardKey === 'rightCard'}
          isDimmed={phase === 'confirming' && selectedCardKey === 'leftCard'}
          onClick={() => phase === 'centered' ? showNextMatchup() : selectCard('rightCard')}
        />
      </div>

      <p className="px-4 pb-4 pt-2 text-center text-[12px] leading-[16.5px] text-gray-2">
        {phase === 'centered'
          ? '한 번 더 누르면 다음 선택으로 넘어갑니다.'
          : '여러분의 선택이 이번주 오버롤에 반영됩니다.'}
      </p>
    </section>
  )
}

function getInitialMatchup(players: PlayerListItem[]): [PlayerListItem, PlayerListItem] {
  const left = players[0]!
  return [left, getNextOpponent(players, left)]
}

function getNextOpponent(players: PlayerListItem[], basePlayer: PlayerListItem, currentOpponent?: PlayerListItem): PlayerListItem {
  const comparablePlayers = players.filter(player =>
    player.id !== basePlayer.id &&
    Math.abs(player.overall - basePlayer.overall) <= 2
  )
  const pool = comparablePlayers.length > 0
    ? comparablePlayers
    : players.filter(player => player.id !== basePlayer.id)
  const currentIndex = currentOpponent
    ? pool.findIndex(player => player.id === currentOpponent.id)
    : -1

  return pool[(currentIndex + 1) % pool.length]!
}

function PickOneCard({
  card,
  isPicked,
  isDimmed,
  onClick,
}: {
  card: PickOneCardState
  isPicked: boolean
  isDimmed: boolean
  onClick: () => void
}) {
  const player = card.player

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-0 top-5 flex h-32 w-[178.5px] flex-col items-center justify-center gap-2.5 rounded-lg bg-[radial-gradient(circle_at_90%_-34%,rgba(207,217,230,0.22),rgba(25,34,50,0.22)_70%),radial-gradient(circle_at_25%_-95%,#191a1b_0%,#2e2d2d_50%,#434040_100%)] p-3 text-left transition-[transform,opacity,filter,box-shadow] duration-700 ease-in-out will-change-transform ${slotClass[card.slot]} ${isPicked ? 'shadow-[inset_0_0_0_3px_#32c2ff]' : ''} ${isDimmed ? 'opacity-[0.34] saturate-[0.35] duration-1000' : ''}`}
      aria-label={`${player.name} 선택`}
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-pill border border-border bg-background">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] font-semibold text-primary">{player.position}</span>
        )}
      </div>
      <div className="w-full text-center">
        <p className="truncate text-[14px] font-semibold leading-[21px] text-white">
          {player.name}
        </p>
        <div className="flex items-center justify-center gap-3 text-[11px] leading-[16.5px] text-[#ebebeb]">
          <span>{player.position}</span>
          {player.seasons && <span className="truncate">{player.seasons}</span>}
        </div>
      </div>
    </button>
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
          {player.seasons && <span className="truncate">{player.seasons}</span>}
        </div>
      </div>

      <div className="w-8 flex-shrink-0 text-center text-[16px] font-semibold leading-[22.5px] text-foreground">
        {player.overall}
      </div>
    </div>
  )
}
