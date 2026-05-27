'use client'

import { useTransition, useState, useRef } from 'react'
import { updateClubStatus, createPlayer, togglePlayerActive } from '@/lib/actions/admin'

interface Props {
  players: Array<{
    id: string
    name: string
    position: string | null
    squad_number: number | null
    is_active: boolean
  }>
  clubStatus: {
    league_rank: number | null
    next_match_opponent: string | null
    next_match_date: string | null
    next_match_venue: string | null
    top_appearances_player_id: string | null
    top_appearances_count: number | null
    top_goals_player_id: string | null
    top_goals_count: number | null
    top_assists_player_id: string | null
    top_assists_count: number | null
  } | null
}

export function AdminDashboard({ players, clubStatus }: Props) {
  const [isClubPending, startClubTransition] = useTransition()
  const [isPlayerPending, startPlayerTransition] = useTransition()
  const [isTogglePending, startToggleTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | undefined>()
  const addPlayerFormRef = useRef<HTMLFormElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toast(text: string, type: 'ok' | 'err') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setMessage({ text, type })
    toastTimerRef.current = setTimeout(() => setMessage(undefined), 3000)
  }

  const activePlayers = players.filter(p => p.is_active)

  function handleClubStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startClubTransition(async () => {
      const result = await updateClubStatus(fd)
      if (result.error) toast(result.error, 'err')
      else toast('구단 현황이 저장되었습니다.', 'ok')
    })
  }

  function handleCreatePlayerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startPlayerTransition(async () => {
      const result = await createPlayer(fd)
      if (result.error) toast(result.error, 'err')
      else {
        toast('선수가 추가되었습니다.', 'ok')
        addPlayerFormRef.current?.reset()
      }
    })
  }

  function handleToggleActive(playerId: string, currentActive: boolean) {
    startToggleTransition(async () => {
      const result = await togglePlayerActive(playerId, !currentActive)
      if (result.error) toast(result.error, 'err')
      else toast(currentActive ? '선수가 비활성화되었습니다.' : '선수가 활성화되었습니다.', 'ok')
    })
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold shadow-lg ${
            message.type === 'ok' ? 'bg-primary text-white' : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">관리자 대시보드</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">투표 · 선수 · 구단 현황 관리</p>
        </div>

        {/* 구단 현황 section */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="text-base font-bold text-foreground">구단 현황</h2>
          <form onSubmit={handleClubStatusSubmit} className="space-y-4">
            {/* 리그 순위 + 홈/원정 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="league_rank" className="text-[12px] font-medium text-muted-foreground">리그 순위</label>
                <input
                  id="league_rank"
                  type="number"
                  name="league_rank"
                  defaultValue={clubStatus?.league_rank ?? ''}
                  min={1}
                  max={20}
                  className="input-field"
                  placeholder="1"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="next_match_venue" className="text-[12px] font-medium text-muted-foreground">홈/원정</label>
                <select
                  id="next_match_venue"
                  name="next_match_venue"
                  defaultValue={clubStatus?.next_match_venue ?? ''}
                  className="input-field"
                >
                  <option value="">선택</option>
                  <option value="home">홈</option>
                  <option value="away">원정</option>
                </select>
              </div>
            </div>

            {/* 다음 경기 상대 */}
            <div className="space-y-1">
              <label htmlFor="next_match_opponent" className="text-[12px] font-medium text-muted-foreground">다음 경기 상대</label>
              <input
                id="next_match_opponent"
                type="text"
                name="next_match_opponent"
                defaultValue={clubStatus?.next_match_opponent ?? ''}
                className="input-field"
                placeholder="ex) Arsenal"
              />
            </div>

            {/* 경기 일시 */}
            <div className="space-y-1">
              <label htmlFor="next_match_date" className="text-[12px] font-medium text-muted-foreground">경기 일시</label>
              <input
                id="next_match_date"
                type="text"
                name="next_match_date"
                defaultValue={clubStatus?.next_match_date ?? ''}
                className="input-field"
                placeholder="ex) 2026-08-16T15:00:00Z"
              />
            </div>

            {/* 시즌 스탯 대표 선수 */}
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-muted-foreground">시즌 스탯 대표 선수</p>

              {/* 최다 출전 */}
              <div className="space-y-1">
                <label htmlFor="top_appearances_player_id" className="text-[11px] text-muted-foreground">최다 출전</label>
                <div className="flex gap-2">
                  <select
                    id="top_appearances_player_id"
                    name="top_appearances_player_id"
                    defaultValue={clubStatus?.top_appearances_player_id ?? ''}
                    className="input-field flex-1"
                  >
                    <option value="">선수 선택</option>
                    {activePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="top_appearances_count"
                    defaultValue={clubStatus?.top_appearances_count ?? ''}
                    min={0}
                    className="input-field w-20"
                    placeholder="횟수"
                  />
                </div>
              </div>

              {/* 최다 득점 */}
              <div className="space-y-1">
                <label htmlFor="top_goals_player_id" className="text-[11px] text-muted-foreground">최다 득점</label>
                <div className="flex gap-2">
                  <select
                    id="top_goals_player_id"
                    name="top_goals_player_id"
                    defaultValue={clubStatus?.top_goals_player_id ?? ''}
                    className="input-field flex-1"
                  >
                    <option value="">선수 선택</option>
                    {activePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="top_goals_count"
                    defaultValue={clubStatus?.top_goals_count ?? ''}
                    min={0}
                    className="input-field w-20"
                    placeholder="골 수"
                  />
                </div>
              </div>

              {/* 최다 어시 */}
              <div className="space-y-1">
                <label htmlFor="top_assists_player_id" className="text-[11px] text-muted-foreground">최다 어시</label>
                <div className="flex gap-2">
                  <select
                    id="top_assists_player_id"
                    name="top_assists_player_id"
                    defaultValue={clubStatus?.top_assists_player_id ?? ''}
                    className="input-field flex-1"
                  >
                    <option value="">선수 선택</option>
                    {activePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="top_assists_count"
                    defaultValue={clubStatus?.top_assists_count ?? ''}
                    min={0}
                    className="input-field w-20"
                    placeholder="어시 수"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isClubPending} className="btn-primary">
              저장하기
            </button>
          </form>
        </section>

        {/* 선수 추가 section */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="text-base font-bold text-foreground">선수 추가</h2>
          <form ref={addPlayerFormRef} onSubmit={handleCreatePlayerSubmit} className="space-y-4">
            {/* 이름 + 등번호 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="player_name" className="text-[12px] font-medium text-muted-foreground">이름 *</label>
                <input
                  id="player_name"
                  type="text"
                  name="name"
                  required
                  className="input-field"
                  placeholder="ex) Alexander Isak"
                />
              </div>
              <div className="w-24 space-y-1">
                <label htmlFor="squad_number" className="text-[12px] font-medium text-muted-foreground">등번호</label>
                <input
                  id="squad_number"
                  type="number"
                  name="squad_number"
                  min={1}
                  max={99}
                  className="input-field"
                  placeholder="9"
                />
              </div>
            </div>

            {/* 포지션 + 국적 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="position" className="text-[12px] font-medium text-muted-foreground">포지션</label>
                <select id="position" name="position" className="input-field">
                  <option value="">선택</option>
                  <option value="GK">GK</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                  <option value="MGR">MGR</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="nationality" className="text-[12px] font-medium text-muted-foreground">국적</label>
                <input
                  id="nationality"
                  type="text"
                  name="nationality"
                  className="input-field"
                  placeholder="ex) Sweden"
                />
              </div>
            </div>

            {/* 생년월일 + 사진 URL */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label htmlFor="birth_date" className="text-[12px] font-medium text-muted-foreground">생년월일</label>
                <input
                  id="birth_date"
                  type="date"
                  name="birth_date"
                  className="input-field"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label htmlFor="photo_url" className="text-[12px] font-medium text-muted-foreground">사진 URL</label>
                <input
                  id="photo_url"
                  type="url"
                  name="photo_url"
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>

            <button type="submit" disabled={isPlayerPending} className="btn-primary">
              + 선수 추가
            </button>
          </form>
        </section>

        {/* 선수 목록 section */}
        <section className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">선수 목록</h2>
          {players.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">등록된 선수가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {players.map(player => (
                <li
                  key={player.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] text-foreground truncate">
                      {player.squad_number ? `#${player.squad_number} ` : ''}
                      <span className="font-medium">{player.name}</span>
                      {player.position && (
                        <span className="ml-1 text-muted-foreground">{player.position}</span>
                      )}
                    </span>
                    {!player.is_active && (
                      <span className="shrink-0 text-[11px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                        비활성
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(player.id, player.is_active)}
                    disabled={isTogglePending}
                    className={`shrink-0 text-[12px] font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-60 ${
                      player.is_active
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {player.is_active ? '비활성' : '활성화'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
