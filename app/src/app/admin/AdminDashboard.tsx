'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createPlayer, createPoll, deletePlayer, updateClubStatus, updatePlayer, updatePlayerSeasonStats, uploadPhoto } from '@/lib/actions/admin'
import { createFarewell } from '@/lib/actions/farewells'
import type { PollListItem } from '@/lib/queries/polls'
import type { DepartureType } from '@/types/database'
import { AdminTransfersPanel, type AdminFarewell } from './AdminTransfersPanel'

type PlayerStatus = 'first_team' | 'loan' | 'u21'
type AdminSection = 'polls' | 'players' | 'transfers' | 'club'
type PlayerCreateTransferType = Extract<DepartureType, 'signing' | 'loan_in' | 'promotion'>

const PLAYER_STATUS_LABEL: Record<PlayerStatus, string> = {
  first_team: '1군',
  loan: '임대',
  u21: 'U21',
}

const PLAYER_GROUPS: Array<{ value: PlayerStatus; label: string }> = [
  { value: 'first_team', label: '1군' },
  { value: 'loan', label: '임대' },
  { value: 'u21', label: 'U21' },
]

const ADMIN_SECTIONS: Array<{ id: AdminSection; label: string; description: string }> = [
  { id: 'polls', label: '투표', description: '투표 생성과 현황' },
  { id: 'players', label: '선수', description: '소속별 선수 관리' },
  { id: 'transfers', label: '이적', description: '팀을 떠난 선수' },
  { id: 'club', label: '구단', description: '순위와 다음 경기' },
]

interface Player {
  id: string
  name: string
  position: string | null
  squad_number: number | null
  is_active: boolean
  squad_status: PlayerStatus
  nationality: string | null
  birth_date: string | null
  photo_url: string | null
  season_stats?: Array<{ season: string; appearances: number; goals: number; assists: number }>
}

interface Props {
  adminEmail: string
  players: Player[]
  polls: PollListItem[]
  farewells: AdminFarewell[]
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

function parseSeasonStatsForm(formData: FormData) {
  const seasons = formData.getAll('stat_season').map(String)
  const appearances = formData.getAll('stat_appearances').map(String)
  const goals = formData.getAll('stat_goals').map(String)
  const assists = formData.getAll('stat_assists').map(String)

  return seasons
    .map((season, index) => ({
      season: season.trim(),
      appearances: appearances[index] ?? '',
      goals: goals[index] ?? '',
      assists: assists[index] ?? '',
    }))
    .filter(row => row.season)
}

function removeSeasonStatFields(formData: FormData) {
  formData.delete('stat_season')
  formData.delete('stat_appearances')
  formData.delete('stat_goals')
  formData.delete('stat_assists')
}

function setPublished(formData: FormData) {
  formData.set('is_published', 'on')
}

type SeasonStatDraft = {
  key: string
  season: string
  appearances: string
  goals: string
  assists: string
}

function createEmptySeasonRow(): SeasonStatDraft {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    season: '',
    appearances: '',
    goals: '',
    assists: '',
  }
}

function SeasonStatsTableInputs({ player }: { player: Player }) {
  const [rows, setRows] = useState<SeasonStatDraft[]>(() => {
    const existingRows = player.season_stats ?? []
    if (existingRows.length === 0) return [createEmptySeasonRow()]
    return existingRows.map((row, index) => ({
      key: `existing-${player.id}-${index}`,
      season: row.season,
      appearances: String(row.appearances),
      goals: String(row.goals),
      assists: String(row.assists),
    }))
  })

  function updateRow(index: number, field: keyof Omit<SeasonStatDraft, 'key'>, value: string) {
    setRows(current => current.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )))
  }

  function removeRow(index: number) {
    setRows(current => {
      const next = current.filter((_, rowIndex) => rowIndex !== index)
      return next.length > 0 ? next : [createEmptySeasonRow()]
    })
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_36px] bg-secondary/50 text-[11px] font-bold text-muted-foreground">
          <div className="px-2 py-2">시즌</div>
          <div className="px-2 py-2 text-right">출전</div>
          <div className="px-2 py-2 text-right">골</div>
          <div className="px-2 py-2 text-right">도움</div>
        </div>
        {rows.map((row, index) => {
          return (
            <div key={row.key} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_36px] border-t border-border">
              <input name="stat_season" value={row.season} onChange={e => updateRow(index, 'season', e.target.value)} className="min-w-0 border-0 px-2 py-2 text-[12px] outline-none" placeholder="2025-26" />
              <input name="stat_appearances" type="number" min={0} value={row.appearances} onChange={e => updateRow(index, 'appearances', e.target.value)} className="min-w-0 border-0 px-2 py-2 text-right text-[12px] outline-none" />
              <input name="stat_goals" type="number" min={0} value={row.goals} onChange={e => updateRow(index, 'goals', e.target.value)} className="min-w-0 border-0 px-2 py-2 text-right text-[12px] outline-none" />
              <input name="stat_assists" type="number" min={0} value={row.assists} onChange={e => updateRow(index, 'assists', e.target.value)} className="min-w-0 border-0 px-2 py-2 text-right text-[12px] outline-none" />
              <button type="button" onClick={() => removeRow(index)} className="text-[13px] font-bold text-red-500" aria-label="Remove season row">
                ×
              </button>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={() => setRows(current => [...current, createEmptySeasonRow()])} className="text-[12px] font-bold text-primary">
        + 시즌 추가
      </button>
    </div>
  )
}

function PollCreateForm({
  players,
  onDone,
  onError,
}: {
  players: Player[]
  onDone: () => void
  onError: (message: string) => void
}) {
  const [pollType, setPollType] = useState<'evaluation' | 'selection'>('evaluation')
  const [textOptions, setTextOptions] = useState(['', ''])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (pollType === 'evaluation') {
      const options = textOptions.map(option => option.trim()).filter(Boolean)
      if (options.length < 2) {
        onError('선택지를 최소 2개 입력해주세요.')
        return
      }
      fd.set('options', JSON.stringify(options.map(label => ({ label }))))
    } else {
      if (selectedPlayerIds.length < 2) {
        onError('선수를 최소 2명 선택해주세요.')
        return
      }
      fd.set('options', JSON.stringify(selectedPlayerIds.map(id => {
        const player = players.find(item => item.id === id)
        return { label: player?.name ?? id, player_id: id }
      })))
      fd.delete('player_id')
    }
    fd.set('type', pollType)

    startTransition(async () => {
      const result = await createPoll(fd)
      if (result.error) onError(result.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 rounded-2xl border border-border bg-white p-4">
      <p className="text-[13px] font-bold text-foreground">투표 만들기</p>
      <input name="title" required className="input-field" placeholder="투표 제목" />
      <input name="description" className="input-field" placeholder="설명(선택)" />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setPollType('evaluation')} className={`rounded-lg border py-2 text-[12px] font-bold ${pollType === 'evaluation' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
          평가형
        </button>
        <button type="button" onClick={() => setPollType('selection')} className={`rounded-lg border py-2 text-[12px] font-bold ${pollType === 'selection' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
          선택형
        </button>
      </div>

      {pollType === 'evaluation' ? (
        <>
          <select name="player_id" required className="input-field">
            <option value="">대상 선수 선택</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>{player.squad_number ? `#${player.squad_number} ` : ''}{player.name}</option>
            ))}
          </select>
          <div className="space-y-1.5">
            {textOptions.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={e => setTextOptions(prev => prev.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                className="input-field"
                placeholder={`선택지 ${index + 1}`}
              />
            ))}
          </div>
          {textOptions.length < 5 && (
            <button type="button" onClick={() => setTextOptions(prev => [...prev, ''])} className="text-[12px] font-bold text-primary">
              + 선택지 추가
            </button>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {players.map(player => {
            const selected = selectedPlayerIds.includes(player.id)
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedPlayerIds(prev => selected ? prev.filter(id => id !== player.id) : [...prev, player.id])}
                className={`rounded-lg border px-2 py-2 text-left text-[12px] font-semibold ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground'}`}
              >
                {player.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input name="scheduled_at" type="datetime-local" className="input-field" />
        <input name="closes_at" type="datetime-local" required className="input-field" />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        투표 생성
      </button>
    </form>
  )
}

export function AdminDashboard({ adminEmail, players, polls, clubStatus, farewells }: Props) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AdminSection>('polls')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPollForm, setShowPollForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [transferPlayer, setTransferPlayer] = useState<Player | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const addFormRef = useRef<HTMLFormElement>(null)

  function toast(text: string, type: 'ok' | 'err' = 'ok') {
    setMessage({ text, type })
    window.setTimeout(() => setMessage(null), 3000)
  }

  function handleAddPlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const transferType = (fd.get('transfer_type') as PlayerCreateTransferType) || 'signing'
    fd.delete('transfer_type')
    if (transferType === 'loan_in') fd.set('squad_status', 'loan')

    startTransition(async () => {
      const result = await createPlayer(fd)
      if (result.error || !result.playerId) {
        toast(result.error ?? '선수 추가에 실패했어요.', 'err')
        return
      }

      const transferForm = new FormData()
      transferForm.set('departure_type', transferType)
      transferForm.set('destination_club', String(fd.get('destination_club') ?? ''))
      transferForm.set('departure_note', String(fd.get('departure_note') ?? ''))
      setPublished(transferForm)
      const transferResult = await createFarewell(result.playerId, transferForm)
      if (transferResult.error) {
        toast(transferResult.error, 'err')
        return
      }

      toast('선수와 이적 소식이 추가됐어요.')
      addFormRef.current?.reset()
      setShowAddForm(false)
    })
  }

  function handleEditPlayer(e: React.FormEvent<HTMLFormElement>, player: Player) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const statRows = parseSeasonStatsForm(fd)
    const photoFile = fd.get('photo_file') as File | null
    removeSeasonStatFields(fd)
    fd.delete('photo_file')
    fd.set('photo_url', player.photo_url ?? '')

    startTransition(async () => {
      if (photoFile && photoFile.size > 0) {
        const photoForm = new FormData()
        photoForm.set('file', photoFile)
        photoForm.set('folder', 'players')
        const uploadResult = await uploadPhoto(photoForm)
        if (uploadResult.error || !uploadResult.url) {
          toast(uploadResult.error ?? '사진 업로드에 실패했습니다.', 'err')
          return
        }
        fd.set('photo_url', uploadResult.url)
      }

      const result = await updatePlayer(player.id, fd)
      if (result.error) {
        toast(result.error, 'err')
        return
      }

      const statsForm = new FormData()
      statsForm.set('season_stats', JSON.stringify(statRows))
      const statsResult = await updatePlayerSeasonStats(player.id, statsForm)
      if (statsResult.error) {
        toast(statsResult.error, 'err')
        return
      }

      toast('선수 정보가 수정됐어요.')
      router.refresh()
      setEditingId(null)
    })
  }

  function handleDeletePlayer(playerId: string) {
    if (!confirm('이 선수를 목록에서 제거할까요?')) return
    startTransition(async () => {
      const result = await deletePlayer(playerId)
      if (result.error) toast(result.error, 'err')
      else toast('선수를 제거했어요.')
    })
  }

  function handleCreateTransfer(e: React.FormEvent<HTMLFormElement>, player: Player) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const type = String(fd.get('departure_type'))
    if (type === 'contract_expired') {
      fd.set('destination_club', 'FA')
    }
    if ((type === 'transferred' || type === 'loan_out') && !String(fd.get('destination_club') ?? '').trim()) {
      toast('이적 또는 임대는 구단 명을 입력해주세요.', 'err')
      return
    }

    startTransition(async () => {
      const result = await createFarewell(player.id, fd)
      if (result.error) {
        toast(result.error, 'err')
        return
      }
      toast('이적 소식이 등록됐어요.')
      setTransferPlayer(null)
    })
  }

  function handleClubStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateClubStatus(new FormData(e.currentTarget))
      if (result.error) toast(result.error, 'err')
      else toast('구단 현황이 저장됐어요.')
    })
  }

  return (
    <div className="pb-24">
      {message && (
        <div className={`fixed top-4 left-1/2 z-50 max-w-[320px] -translate-x-1/2 rounded-xl px-4 py-2.5 text-center text-[13px] font-semibold text-white shadow-lg ${message.type === 'ok' ? 'bg-primary' : 'bg-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className="px-4 pt-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px] font-black text-foreground tracking-tight">관리자 대시보드</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">ADMIN</span>
          </div>
          <p className="text-[13px] text-muted-foreground">{adminEmail}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ADMIN_SECTIONS.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                activeSection === section.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-white text-foreground hover:border-primary/30'
              }`}
            >
              <span className="block text-[13px] font-black">{section.label}</span>
              <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">{section.description}</span>
            </button>
          ))}
        </div>

        {activeSection === 'polls' && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">투표 관리</p>
              <button type="button" onClick={() => setShowPollForm(prev => !prev)} className="text-[12px] font-bold text-primary">
                {showPollForm ? '닫기' : '+ 만들기'}
              </button>
            </div>
            {showPollForm && (
              <PollCreateForm
                players={players}
                onDone={() => {
                  toast('투표를 만들었어요.')
                  setShowPollForm(false)
                }}
                onError={text => toast(text, 'err')}
              />
            )}
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="border-b border-border px-4 py-3.5">
                <p className="text-[14px] font-bold text-foreground">투표 목록</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">기존 투표와 연결된 선수 확인</p>
              </div>
              {polls.length === 0 ? (
                <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">등록된 투표가 없어요.</p>
              ) : (
                <div className="divide-y divide-border">
                  {polls.map(poll => (
                    <Link key={poll.id} href={`/polls/${poll.id}`} className="block px-4 py-3 hover:bg-secondary/50">
                      <p className="truncate text-[13px] font-bold text-foreground">{poll.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {poll.status} · {poll.vote_count.toLocaleString()}명 참여
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === 'players' && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">선수 관리</p>
              <button type="button" onClick={() => setShowAddForm(prev => !prev)} className="text-[12px] font-bold text-primary">
                {showAddForm ? '닫기' : '+ 추가'}
              </button>
            </div>

            {showAddForm && (
              <div className="mb-2 rounded-2xl border border-border bg-white p-4">
                <p className="mb-3 text-[13px] font-bold text-foreground">선수 추가</p>
                <form ref={addFormRef} onSubmit={handleAddPlayer} className="space-y-2.5">
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      이름 *
                      <input name="name" required className="input-field mt-0.5" placeholder="Alexander Isak" />
                    </label>
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      등번호
                      <input name="squad_number" type="number" className="input-field mt-0.5 text-center" placeholder="14" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      구분
                      <select name="transfer_type" defaultValue="signing" className="input-field mt-0.5">
                        <option value="signing">영입</option>
                        <option value="loan_in">임대</option>
                        <option value="promotion">승격</option>
                      </select>
                    </label>
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      상태
                      <select name="squad_status" defaultValue="first_team" className="input-field mt-0.5">
                        <option value="first_team">1군</option>
                        <option value="loan">임대</option>
                        <option value="u21">U21</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select name="position" className="input-field">
                      <option value="">포지션</option>
                      <option value="GK">GK</option>
                      <option value="DEF">DEF</option>
                      <option value="MID">MID</option>
                      <option value="FWD">FWD</option>
                      <option value="MGR">MGR</option>
                    </select>
                    <input name="nationality" className="input-field" placeholder="국적" />
                  </div>
                  <input name="birth_date" type="date" className="input-field" />
                  <input name="destination_club" className="input-field" placeholder="구단" />
                  <textarea name="departure_note" rows={3} className="input-field resize-none" placeholder="이적 메모" />
                  <button type="submit" disabled={isPending} className="btn-primary mt-1">
                    + 선수 추가
                  </button>
                </form>
              </div>
            )}

            {transferPlayer && (
              <div className="mb-2 rounded-2xl border border-primary/20 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">이적 등록</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{transferPlayer.name} 선수의 이적 이벤트를 만듭니다.</p>
                  </div>
                  <button type="button" onClick={() => setTransferPlayer(null)} className="text-[12px] font-semibold text-muted-foreground">닫기</button>
                </div>
                <form onSubmit={e => handleCreateTransfer(e, transferPlayer)} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <select name="departure_type" defaultValue="transferred" className="input-field">
                      <option value="transferred">이적</option>
                      <option value="contract_expired">계약 만료</option>
                      <option value="loan_out">임대</option>
                    </select>
                    <input name="destination_club" className="input-field" placeholder="구단 명 또는 FA" />
                  </div>
                  <textarea name="departure_note" rows={3} className="input-field resize-none" placeholder="이적 메모" />
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                    <input name="is_published" type="checkbox" className="h-4 w-4 rounded border-border" />
                    홈과 이적 페이지에 바로 공개
                  </label>
                  <button type="submit" disabled={isPending} className="btn-primary">이적 등록</button>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {PLAYER_GROUPS.map(group => {
                const groupPlayers = players.filter(player => player.squad_status === group.value)
                return (
                  <div key={group.value} className="overflow-hidden rounded-2xl border border-border bg-white">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-[13px] font-bold text-foreground">{group.label}</p>
                      <span className="text-[11px] font-semibold text-muted-foreground">{groupPlayers.length}명</span>
                    </div>
                    {groupPlayers.length === 0 ? (
                      <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">등록된 선수가 없어요.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {groupPlayers.map(player => (
                          <div key={player.id} className="px-4 py-3">
                            {editingId === player.id ? (
                              <form onSubmit={e => handleEditPlayer(e, player)} className="space-y-2.5">
                                <div className="grid grid-cols-[1fr_80px] gap-2">
                                  <input name="name" defaultValue={player.name} className="input-field" />
                                  <input name="squad_number" type="number" defaultValue={player.squad_number ?? ''} className="input-field text-center" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <select name="position" defaultValue={player.position ?? ''} className="input-field">
                                    <option value="">포지션</option>
                                    <option value="GK">GK</option>
                                    <option value="DEF">DEF</option>
                                    <option value="MID">MID</option>
                                    <option value="FWD">FWD</option>
                                    <option value="MGR">MGR</option>
                                  </select>
                                  <select name="squad_status" defaultValue={player.squad_status ?? 'first_team'} className="input-field">
                                    <option value="first_team">1군</option>
                                    <option value="loan">임대</option>
                                    <option value="u21">U21</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input name="nationality" defaultValue={player.nationality ?? ''} className="input-field" placeholder="국적" />
                                  <input name="birth_date" type="date" defaultValue={player.birth_date ?? ''} className="input-field" />
                                </div>
                                <label className="block rounded-lg border border-dashed border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground">
                                  사진 변경
                                  <input name="photo_file" type="file" accept="image/*" className="mt-2 block w-full text-[12px]" />
                                </label>
                                <SeasonStatsTableInputs player={player} />
                                <div className="flex gap-2">
                                  <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-primary py-2 text-[12px] font-bold text-white">저장</button>
                                  <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-lg bg-secondary py-2 text-[12px] font-semibold text-foreground">취소</button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[12px] font-black text-primary">
                                  {player.photo_url ? (
                                    <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    player.squad_number ?? player.name.slice(0, 2)
                                  )}
                                </div>
                                <Link href={`/players/${player.id}`} className="min-w-0 flex-1">
                                  <p className="truncate text-[13px] font-bold text-foreground">{player.name}</p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    #{player.squad_number ?? '-'} · {player.position ?? '포지션 없음'} · {PLAYER_STATUS_LABEL[player.squad_status ?? 'first_team']}
                                  </p>
                                </Link>
                                <button type="button" onClick={() => setTransferPlayer(player)} className="text-[12px] font-bold text-primary">이적</button>
                                <button type="button" onClick={() => setEditingId(player.id)} className="text-[12px] font-semibold text-muted-foreground">수정</button>
                                <button type="button" onClick={() => handleDeletePlayer(player.id)} className="text-[12px] font-semibold text-red-500">삭제</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {activeSection === 'transfers' && (
          <AdminTransfersPanel farewells={farewells} onToast={toast} />
        )}

        {activeSection === 'club' && (
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">구단 현황 관리</p>
            <form onSubmit={handleClubStatusSubmit} className="space-y-2.5 rounded-2xl border border-border bg-white p-4">
              <input name="league_rank" type="number" defaultValue={clubStatus?.league_rank ?? ''} className="input-field" placeholder="리그 순위" />
              <input name="next_match_opponent" defaultValue={clubStatus?.next_match_opponent ?? ''} className="input-field" placeholder="다음 경기 상대" />
              <div className="grid grid-cols-2 gap-2">
                <input name="next_match_date" type="datetime-local" defaultValue={clubStatus?.next_match_date?.slice(0, 16) ?? ''} className="input-field" />
                <select name="next_match_venue" defaultValue={clubStatus?.next_match_venue ?? ''} className="input-field">
                  <option value="">장소</option>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </select>
              </div>
              <button type="submit" disabled={isPending} className="btn-primary">저장</button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
