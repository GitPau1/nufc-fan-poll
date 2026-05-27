'use client'

import { useTransition, useState, useRef } from 'react'
import { updateClubStatus, createPlayer, updatePlayer, togglePlayerActive } from '@/lib/actions/admin'

interface Player {
  id: string
  name: string
  position: string | null
  squad_number: number | null
  is_active: boolean
}

interface Props {
  adminEmail: string
  players: Player[]
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

export function AdminDashboard({ adminEmail, players, clubStatus }: Props) {
  const [isClubPending, startClubTransition] = useTransition()
  const [isPlayerPending, startPlayerTransition] = useTransition()
  const [isTogglePending, startToggleTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | undefined>()
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 선수 추가 폼 표시 여부
  const [showAddForm, setShowAddForm] = useState(false)
  const addFormRef = useRef<HTMLFormElement>(null)

  // 인라인 수정 중인 선수 ID
  const [editingId, setEditingId] = useState<string | null>(null)

  const activePlayers = players.filter(p => p.is_active)

  function toast(text: string, type: 'ok' | 'err') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setMessage({ text, type })
    toastTimerRef.current = setTimeout(() => setMessage(undefined), 3000)
  }

  // ── 구단 현황 저장 ──
  function handleClubStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startClubTransition(async () => {
      const result = await updateClubStatus(new FormData(e.currentTarget))
      result.error ? toast(result.error, 'err') : toast('저장됐어요!', 'ok')
    })
  }

  // ── 선수 추가 ──
  function handleAddPlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startPlayerTransition(async () => {
      const result = await createPlayer(new FormData(e.currentTarget))
      if (result.error) {
        toast(result.error, 'err')
      } else {
        toast('선수를 추가했어요!', 'ok')
        addFormRef.current?.reset()
        setShowAddForm(false)
      }
    })
  }

  // ── 선수 수정 ──
  function handleEditPlayer(e: React.FormEvent<HTMLFormElement>, playerId: string) {
    e.preventDefault()
    startPlayerTransition(async () => {
      const result = await updatePlayer(playerId, new FormData(e.currentTarget))
      if (result.error) {
        toast(result.error, 'err')
      } else {
        toast('수정됐어요!', 'ok')
        setEditingId(null)
      }
    })
  }

  // ── 활성/비활성 토글 ──
  function handleToggle(playerId: string, currentActive: boolean) {
    startToggleTransition(async () => {
      const result = await togglePlayerActive(playerId, !currentActive)
      result.error
        ? toast(result.error, 'err')
        : toast(currentActive ? '비활성화됐어요' : '활성화됐어요', 'ok')
    })
  }

  return (
    <div className="pb-24">
      {/* Toast */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg ${message.type === 'ok' ? 'bg-primary text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="px-4 pt-5 space-y-4">
        {/* 헤더 */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px] font-black text-foreground tracking-tight">관리자 대시보드</span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">⚙ ADMIN</span>
          </div>
          <p className="text-[13px] text-muted-foreground">{adminEmail}</p>
        </div>

        {/* ── 투표 관리 ── */}
        <section>
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">🗳 투표 관리</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">새 투표 만들기</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">평가형 / 선택형 투표 생성</p>
              </div>
              <button className="px-3.5 py-2 bg-primary text-white text-[13px] font-bold rounded-lg">+ 만들기</button>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">투표 목록</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">활성 · 예정 · 종료 관리</p>
              </div>
              <button className="px-3.5 py-2 bg-secondary text-foreground text-[13px] font-semibold rounded-lg">관리 →</button>
            </div>
          </div>
        </section>

        {/* ── 선수 관리 ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">👥 선수 관리</p>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="text-[12px] font-bold text-primary"
            >
              {showAddForm ? '✕ 닫기' : '+ 추가'}
            </button>
          </div>

          {/* 선수 추가 폼 */}
          {showAddForm && (
            <div className="bg-white border border-border rounded-2xl p-4 mb-2">
              <p className="text-[13px] font-bold text-foreground mb-3">선수 추가</p>
              <form ref={addFormRef} onSubmit={handleAddPlayer} className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="add-name" className="text-[11px] font-semibold text-muted-foreground">이름 *</label>
                    <input id="add-name" name="name" required className="input-field mt-0.5" placeholder="Alexander Isak" />
                  </div>
                  <div className="w-16">
                    <label htmlFor="add-squad" className="text-[11px] font-semibold text-muted-foreground">등번호</label>
                    <input id="add-squad" name="squad_number" type="number" className="input-field mt-0.5 text-center" placeholder="14" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="add-pos" className="text-[11px] font-semibold text-muted-foreground">포지션</label>
                    <select id="add-pos" name="position" className="input-field mt-0.5">
                      <option value="">선택</option>
                      <option value="GK">GK</option>
                      <option value="DEF">DEF</option>
                      <option value="MID">MID</option>
                      <option value="FWD">FWD</option>
                      <option value="MGR">MGR</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="add-nat" className="text-[11px] font-semibold text-muted-foreground">국적</label>
                    <input id="add-nat" name="nationality" className="input-field mt-0.5" placeholder="Sweden" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="add-birth" className="text-[11px] font-semibold text-muted-foreground">생년월일</label>
                    <input id="add-birth" name="birth_date" type="date" className="input-field mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="add-photo" className="text-[11px] font-semibold text-muted-foreground">사진 URL</label>
                    <input id="add-photo" name="photo_url" type="url" className="input-field mt-0.5" placeholder="https://..." />
                  </div>
                </div>
                <button type="submit" disabled={isPlayerPending} className="btn-primary mt-1">+ 선수 추가</button>
              </form>
            </div>
          )}

          {/* 선수 목록 */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            {players.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground text-center">등록된 선수가 없어요</p>
            ) : (
              players.map((player, i) => (
                <div key={player.id}>
                  {i > 0 && <div className="h-px bg-border mx-4" />}

                  {editingId === player.id ? (
                    /* ── 인라인 수정 폼 ── */
                    <div className="px-4 py-3 bg-secondary/40">
                      <p className="text-[12px] font-bold text-foreground mb-2">선수 수정</p>
                      <form onSubmit={e => handleEditPlayer(e, player.id)} className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">이름 *</label>
                            <input name="name" required defaultValue={player.name} className="input-field mt-0.5" />
                          </div>
                          <div className="w-16">
                            <label className="text-[11px] font-semibold text-muted-foreground">등번호</label>
                            <input name="squad_number" type="number" defaultValue={player.squad_number ?? ''} className="input-field mt-0.5 text-center" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">포지션</label>
                            <select name="position" defaultValue={player.position ?? ''} className="input-field mt-0.5">
                              <option value="">선택</option>
                              <option value="GK">GK</option>
                              <option value="DEF">DEF</option>
                              <option value="MID">MID</option>
                              <option value="FWD">FWD</option>
                              <option value="MGR">MGR</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={isPlayerPending} className="flex-1 py-2 bg-primary text-white text-[12px] font-bold rounded-lg disabled:opacity-60">저장</button>
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 py-2 bg-secondary text-foreground text-[12px] font-semibold rounded-lg">취소</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* ── 선수 행 ── */
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* 등번호 서클 */}
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-primary">
                          {player.squad_number ?? '—'}
                        </span>
                      </div>
                      {/* 이름 + 포지션 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate flex items-center gap-1.5">
                          {player.name}
                          {!player.is_active && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">비활성</span>
                          )}
                        </p>
                        {player.position && (
                          <p className="text-[11px] text-muted-foreground">{player.position}</p>
                        )}
                      </div>
                      {/* 버튼 */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setEditingId(player.id)}
                          className="px-2.5 py-1 border border-border text-[11px] font-semibold text-muted-foreground bg-white rounded-md hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggle(player.id, player.is_active)}
                          disabled={isTogglePending}
                          className={`px-2.5 py-1 border text-[11px] font-semibold rounded-md transition-colors disabled:opacity-60 ${
                            player.is_active
                              ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                              : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                          }`}
                        >
                          {player.is_active ? '비활성' : '활성화'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 구단 현황 관리 ── */}
        <section>
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">📊 구단 현황 관리</p>
          <div className="bg-white border border-border rounded-2xl p-4">
            <form onSubmit={handleClubStatusSubmit} className="space-y-2.5">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="league_rank" className="text-[11px] font-semibold text-muted-foreground">리그 순위</label>
                  <input id="league_rank" name="league_rank" type="number" defaultValue={clubStatus?.league_rank ?? ''} min={1} max={20} className="input-field mt-0.5" placeholder="4" />
                </div>
                <div className="flex-1">
                  <label htmlFor="next_match_venue" className="text-[11px] font-semibold text-muted-foreground">홈/원정</label>
                  <select id="next_match_venue" name="next_match_venue" defaultValue={clubStatus?.next_match_venue ?? ''} className="input-field mt-0.5">
                    <option value="">선택</option>
                    <option value="home">홈</option>
                    <option value="away">원정</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="next_match_opponent" className="text-[11px] font-semibold text-muted-foreground">다음 경기 상대</label>
                <input id="next_match_opponent" name="next_match_opponent" defaultValue={clubStatus?.next_match_opponent ?? ''} className="input-field mt-0.5" placeholder="맨체스터 시티" />
              </div>
              <div>
                <label htmlFor="next_match_date" className="text-[11px] font-semibold text-muted-foreground">경기 일시</label>
                <input id="next_match_date" name="next_match_date" defaultValue={clubStatus?.next_match_date ?? ''} className="input-field mt-0.5" placeholder="예: 5월 31일 토" />
              </div>

              {/* 시즌 스탯 */}
              <div className="pt-2 border-t border-border">
                <p className="text-[12px] font-bold text-foreground mb-2">시즌 스탯 대표 선수</p>
                {([
                  { label: '최다 출전', idKey: 'top_appearances_player_id', countKey: 'top_appearances_count', placeholder: '횟수', defaultId: clubStatus?.top_appearances_player_id, defaultCount: clubStatus?.top_appearances_count },
                  { label: '최다 득점', idKey: 'top_goals_player_id',       countKey: 'top_goals_count',       placeholder: '골',   defaultId: clubStatus?.top_goals_player_id,       defaultCount: clubStatus?.top_goals_count },
                  { label: '최다 어시', idKey: 'top_assists_player_id',     countKey: 'top_assists_count',     placeholder: '어시', defaultId: clubStatus?.top_assists_player_id,     defaultCount: clubStatus?.top_assists_count },
                ] as const).map(({ label, idKey, countKey, placeholder, defaultId, defaultCount }) => (
                  <div key={idKey} className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0">{label}</span>
                    <select name={idKey} defaultValue={defaultId ?? ''} className="input-field flex-1 text-[12px]">
                      <option value="">선수 선택</option>
                      {activePlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                        </option>
                      ))}
                    </select>
                    <input name={countKey} type="number" defaultValue={defaultCount ?? ''} className="input-field w-14 text-center text-[12px]" placeholder={placeholder} />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isClubPending} className="btn-secondary">저장하기</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
