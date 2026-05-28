'use client'

import { useTransition, useState, useRef } from 'react'
import Link from 'next/link'
import { updateClubStatus, createPlayer, updatePlayer, deletePlayer, createPoll, uploadPhoto } from '@/lib/actions/admin'
import type { PollListItem } from '@/lib/queries/polls'

type PlayerStatus = 'first_team' | 'loan' | 'u21'

const PLAYER_STATUS_LABEL: Record<PlayerStatus, string> = {
  first_team: '1군',
  loan: '임대',
  u21: 'U21',
}

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
}

interface Props {
  adminEmail: string
  players: Player[]
  polls: PollListItem[]
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

// ── 이미지 업로드 헬퍼 (서버 액션 경유 → service role key로 RLS 우회) ──
async function uploadPlayerPhoto(
  file: File,
  onError: (msg: string) => void,
  folder = 'players'
): Promise<string | null> {
  const fd = new FormData()
  fd.set('file', file)
  fd.set('folder', folder)
  const result = await uploadPhoto(fd)
  if (result.error) {
    onError(`사진 업로드 실패: ${result.error}`)
    return null
  }
  return result.url ?? null
}

// ── 사진 업로드 인풋 ──────────────────────────────────────
function PhotoUploadInput({
  currentUrl,
  onUploaded,
  onError,
  folder = 'players',
}: {
  currentUrl?: string | null
  onUploaded: (url: string) => void
  onError: (msg: string) => void
  folder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadPlayerPhoto(file, onError, folder)
    setUploading(false)
    if (url) {
      setPreview(url)
      onUploaded(url)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="preview"
          className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0"
        />
      )}
      <label
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-[12px] font-medium cursor-pointer hover:border-primary/50 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {uploading ? '업로드 중...' : preview ? '📷 사진 변경' : '📷 사진 업로드'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
    </div>
  )
}

// ── 투표 만들기 폼 ────────────────────────────────────────
// 평가형: 선수 1명 선택 + 텍스트 선택지 2~5개
// 선택형: 선수 여러 명 선택 (각 선수가 선택지가 됨)
function PollCreateForm({
  players,
  onClose,
  onSuccess,
  onError,
}: {
  players: Player[]
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [pollType, setPollType] = useState<'evaluation' | 'selection'>('evaluation')
  // 평가형: 텍스트 선택지
  const [textOptions, setTextOptions] = useState<string[]>(['', ''])
  // 선택형: 선택된 선수 ID 목록
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [formError, setFormError] = useState<string>()

  const activePlayers = players

  function addTextOption() {
    if (textOptions.length < 5) setTextOptions(v => [...v, ''])
  }
  function removeTextOption(i: number) {
    if (textOptions.length > 2) setTextOptions(v => v.filter((_, idx) => idx !== i))
  }
  function updateTextOption(i: number, val: string) {
    setTextOptions(v => v.map((opt, idx) => (idx === i ? val : opt)))
  }

  function togglePlayer(id: string) {
    setSelectedPlayerIds(v =>
      v.includes(id)
        ? v.filter(pid => pid !== id)
        : v.length < 5
          ? [...v, id]
          : v
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(undefined)
    const fd = new FormData(e.currentTarget)
    if (thumbnailUrl) fd.set('thumbnail_url', thumbnailUrl)

    if (pollType === 'evaluation') {
      const valid = textOptions.map(s => s.trim()).filter(Boolean)
      if (valid.length < 2) {
        setFormError('선택지를 최소 2개 입력해주세요.')
        return
      }
      fd.set('options', JSON.stringify(valid.map(label => ({ label }))))
    } else {
      if (selectedPlayerIds.length < 2) {
        setFormError('선수를 최소 2명 선택해주세요.')
        return
      }
      const options = selectedPlayerIds.map(id => {
        const p = activePlayers.find(pl => pl.id === id)!
        return { label: p.name, player_id: id }
      })
      fd.set('options', JSON.stringify(options))
      fd.delete('player_id') // 선택형은 poll 자체에 선수 없음
    }

    startTransition(async () => {
      const result = await createPoll(fd)
      if (result.error) {
        onError(result.error)
        setFormError(result.error)
      } else {
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-bold text-foreground">새 투표 만들기</p>
        <button type="button" onClick={onClose} className="text-muted-foreground text-[12px]">
          ✕ 닫기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* 제목 */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">제목 *</label>
          <input
            name="title"
            required
            className="input-field mt-0.5"
            placeholder="이번 경기 최고의 선수는?"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">설명 (선택)</label>
          <input name="description" className="input-field mt-0.5" placeholder="추가 설명..." />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">썸네일 (선택)</label>
          <div className="mt-0.5">
            <PhotoUploadInput
              currentUrl={thumbnailUrl}
              folder="polls"
              onUploaded={url => setThumbnailUrl(url)}
              onError={onError}
            />
          </div>
        </div>

        {/* 투표 유형 */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">투표 유형</label>
          <div className="flex gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => setPollType('evaluation')}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${pollType === 'evaluation' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
            >
              평가형
            </button>
            <button
              type="button"
              onClick={() => setPollType('selection')}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${pollType === 'selection' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
            >
              선택형
            </button>
          </div>
          <input type="hidden" name="type" value={pollType} />
        </div>

        {/* 평가형: 선수 1명 + 텍스트 선택지 */}
        {pollType === 'evaluation' && (
          <>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">대상 선수 *</label>
              <select name="player_id" required className="input-field mt-0.5">
                <option value="">선수 선택</option>
                {activePlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  선택지 ({textOptions.length}/5)
                </label>
                {textOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={addTextOption}
                    className="text-[11px] text-primary font-semibold"
                  >
                    + 추가
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {textOptions.map((opt, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      value={opt}
                      onChange={e => updateTextOption(i, e.target.value)}
                      className="input-field flex-1"
                      placeholder={`선택지 ${i + 1}`}
                    />
                    {textOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeTextOption(i)}
                        className="text-red-400 text-[13px] px-1 flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 선택형: 선수 여러 명 선택 */}
        {pollType === 'selection' && (
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              선수 선택 ({selectedPlayerIds.length}/5, 최소 2명)
            </label>
            <div className="mt-1 space-y-1 max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {activePlayers.map(p => {
                const selected = selectedPlayerIds.includes(p.id)
                const disabled = !selected && selectedPlayerIds.length >= 5
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !disabled && togglePlayer(p.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${selected ? 'bg-primary/5' : disabled ? 'opacity-40' : 'hover:bg-secondary'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected ? 'border-primary bg-primary' : 'border-border'}`}>
                      {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-[12px] font-medium text-foreground">
                      {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                    </span>
                    {p.position && (
                      <span className="text-[10px] text-muted-foreground ml-auto">{p.position}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 마감일 */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">마감 시간 *</label>
          <input name="closes_at" type="datetime-local" required className="input-field mt-0.5" />
        </div>

        {formError && <p className="text-[12px] text-red-500 font-medium">{formError}</p>}

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '생성 중...' : '투표 만들기'}
        </button>
      </form>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export function AdminDashboard({ adminEmail, players, polls, clubStatus }: Props) {
  const [isClubPending, startClubTransition] = useTransition()
  const [isPlayerPending, startPlayerTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | undefined>()
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const addFormRef = useRef<HTMLFormElement>(null)
  const [addPhotoUrl, setAddPhotoUrl] = useState<string>('')

  const [editingId, setEditingId] = useState<string | null>(null)
  // editPhotoUrl: undefined = not changed (keep existing); string = new URL
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(undefined)

  const [showPollForm, setShowPollForm] = useState(false)

  const activePlayers = players

  function toast(text: string, type: 'ok' | 'err') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setMessage({ text, type })
    toastTimerRef.current = setTimeout(() => setMessage(undefined), 3500)
  }

  function handleClubStatusSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startClubTransition(async () => {
      const result = await updateClubStatus(new FormData(e.currentTarget))
      if (result.error) toast(result.error, 'err')
      else toast('저장됐어요!', 'ok')
    })
  }

  function handleAddPlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (addPhotoUrl) fd.set('photo_url', addPhotoUrl)
    startPlayerTransition(async () => {
      const result = await createPlayer(fd)
      if (result.error) {
        toast(result.error, 'err')
      } else {
        toast('선수를 추가했어요!', 'ok')
        addFormRef.current?.reset()
        setAddPhotoUrl('')
        setShowAddForm(false)
      }
    })
  }

  function handleEditPlayer(e: React.FormEvent<HTMLFormElement>, player: Player) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // editPhotoUrl=undefined means no change → keep existing photo
    // editPhotoUrl=string means newly uploaded → use new URL
    const photoToSave = editPhotoUrl !== undefined ? editPhotoUrl : (player.photo_url ?? '')
    fd.set('photo_url', photoToSave)
    startPlayerTransition(async () => {
      const result = await updatePlayer(player.id, fd)
      if (result.error) {
        toast(result.error, 'err')
      } else {
        toast('수정됐어요!', 'ok')
        setEditingId(null)
        setEditPhotoUrl(undefined)
      }
    })
  }

  function handleDeletePlayer(playerId: string) {
    if (!confirm('이 선수를 목록에서 제거할까요?')) return
    startPlayerTransition(async () => {
      const result = await deletePlayer(playerId)
      if (result.error) toast(result.error, 'err')
      else toast('선수를 제거했어요', 'ok')
      if (!result.error && editingId === playerId) setEditingId(null)
    })
  }

  function startEditing(player: Player) {
    setEditingId(player.id)
    setEditPhotoUrl(undefined) // reset: no change yet
  }

  return (
    <div className="pb-24">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[13px] font-semibold shadow-lg max-w-[320px] text-center ${
            message.type === 'ok' ? 'bg-primary text-white' : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="px-4 pt-5 space-y-4">
        {/* 헤더 */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px] font-black text-foreground tracking-tight">관리자 대시보드</span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              ⚙ ADMIN
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">{adminEmail}</p>
        </div>

        {/* ── 투표 관리 ── */}
        <section>
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
            🗳 투표 관리
          </p>

          {showPollForm && (
            <PollCreateForm
              players={players}
              onClose={() => setShowPollForm(false)}
              onSuccess={() => toast('투표를 만들었어요!', 'ok')}
              onError={msg => toast(msg, 'err')}
            />
          )}

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">새 투표 만들기</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">평가형 / 선택형 투표 생성</p>
              </div>
              <button
                onClick={() => setShowPollForm(v => !v)}
                className="px-3.5 py-2 bg-primary text-white text-[13px] font-bold rounded-lg"
              >
                {showPollForm ? '✕ 닫기' : '+ 만들기'}
              </button>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">투표 목록</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">기존 투표와 연결된 선수 확인</p>
              </div>
              <span className="text-[12px] font-bold text-primary">{polls.length}개</span>
            </div>
            {polls.length > 0 ? (
              <div className="border-t border-border divide-y divide-border">
                {polls.map(poll => (
                  <Link
                    key={poll.id}
                    href={`/polls/${poll.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 overflow-hidden flex-shrink-0">
                      {poll.thumbnail_url || poll.player?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={poll.thumbnail_url ?? poll.player?.photo_url ?? ''}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] font-black text-primary">
                          {poll.title.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{poll.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {poll.player ? `${poll.player.name} · ` : ''}
                        {poll.status === 'active' ? '진행 중' : poll.status === 'scheduled' ? '예정' : '종료'}
                        {' · '}
                        {poll.vote_count.toLocaleString()}명 참여
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="border-t border-border px-4 py-4 text-center text-[12px] text-muted-foreground">
                등록된 투표가 없어요
              </p>
            )}
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
                    <label htmlFor="add-name" className="text-[11px] font-semibold text-muted-foreground">
                      이름 *
                    </label>
                    <input
                      id="add-name"
                      name="name"
                      required
                      className="input-field mt-0.5"
                      placeholder="Alexander Isak"
                    />
                  </div>
                  <div className="w-16">
                    <label htmlFor="add-squad" className="text-[11px] font-semibold text-muted-foreground">
                      등번호
                    </label>
                    <input
                      id="add-squad"
                      name="squad_number"
                      type="number"
                      className="input-field mt-0.5 text-center"
                      placeholder="14"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="add-pos" className="text-[11px] font-semibold text-muted-foreground">
                      포지션
                    </label>
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
                    <label htmlFor="add-nat" className="text-[11px] font-semibold text-muted-foreground">
                      국적
                    </label>
                    <input
                      id="add-nat"
                      name="nationality"
                      className="input-field mt-0.5"
                      placeholder="Sweden"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="add-squad-status" className="text-[11px] font-semibold text-muted-foreground">
                    상태
                  </label>
                  <select id="add-squad-status" name="squad_status" defaultValue="first_team" className="input-field mt-0.5">
                    <option value="first_team">1군</option>
                    <option value="loan">임대</option>
                    <option value="u21">U21</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="add-birth" className="text-[11px] font-semibold text-muted-foreground">
                    생년월일
                  </label>
                  <input id="add-birth" name="birth_date" type="date" className="input-field mt-0.5" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">선수 사진</label>
                  <div className="mt-0.5">
                    <PhotoUploadInput
                      onUploaded={url => setAddPhotoUrl(url)}
                      onError={msg => toast(msg, 'err')}
                    />
                  </div>
                </div>
                <button type="submit" disabled={isPlayerPending} className="btn-primary mt-1">
                  + 선수 추가
                </button>
              </form>
            </div>
          )}

          {/* 선수 목록 */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            {players.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-muted-foreground text-center">
                등록된 선수가 없어요
              </p>
            ) : (
              players.map((player, i) => (
                <div key={player.id}>
                  {i > 0 && <div className="h-px bg-border mx-4" />}

                  {editingId === player.id ? (
                    /* 인라인 수정 폼 */
                    <div className="px-4 py-3 bg-secondary/40">
                      <p className="text-[12px] font-bold text-foreground mb-2">선수 수정</p>
                      <form
                        onSubmit={e => handleEditPlayer(e, player)}
                        className="space-y-2"
                      >
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              이름 *
                            </label>
                            <input
                              name="name"
                              required
                              defaultValue={player.name}
                              className="input-field mt-0.5"
                            />
                          </div>
                          <div className="w-16">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              등번호
                            </label>
                            <input
                              name="squad_number"
                              type="number"
                              defaultValue={player.squad_number ?? ''}
                              className="input-field mt-0.5 text-center"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              포지션
                            </label>
                            <select
                              name="position"
                              defaultValue={player.position ?? ''}
                              className="input-field mt-0.5"
                            >
                              <option value="">선택</option>
                              <option value="GK">GK</option>
                              <option value="DEF">DEF</option>
                              <option value="MID">MID</option>
                              <option value="FWD">FWD</option>
                              <option value="MGR">MGR</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              국적
                            </label>
                            <input
                              name="nationality"
                              defaultValue={player.nationality ?? ''}
                              className="input-field mt-0.5"
                              placeholder="Sweden"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            상태
                          </label>
                          <select
                            name="squad_status"
                            defaultValue={player.squad_status ?? 'first_team'}
                            className="input-field mt-0.5"
                          >
                            <option value="first_team">1군</option>
                            <option value="loan">임대</option>
                            <option value="u21">U21</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            생년월일
                          </label>
                          <input
                            name="birth_date"
                            type="date"
                            defaultValue={player.birth_date ?? ''}
                            className="input-field mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            선수 사진
                          </label>
                          <div className="mt-0.5">
                            <PhotoUploadInput
                              currentUrl={player.photo_url}
                              onUploaded={url => setEditPhotoUrl(url)}
                              onError={msg => toast(msg, 'err')}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isPlayerPending}
                            className="flex-1 py-2 bg-primary text-white text-[12px] font-bold rounded-lg disabled:opacity-60"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditPhotoUrl(undefined)
                            }}
                            className="flex-1 py-2 bg-secondary text-foreground text-[12px] font-semibold rounded-lg"
                          >
                            취소
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* 선수 행 */
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {player.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[13px] font-bold text-primary">
                            {player.squad_number ?? '—'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate flex items-center gap-1.5">
                          {player.squad_number && (
                            <span className="text-[11px] text-muted-foreground font-normal">
                              #{player.squad_number}
                            </span>
                          )}
                          {player.name}
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {PLAYER_STATUS_LABEL[player.squad_status ?? 'first_team']}
                          </span>
                        </p>
                        {player.position && (
                          <p className="text-[11px] text-muted-foreground">
                            {player.position}
                            {player.nationality ? ` · ${player.nationality}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEditing(player)}
                          className="px-2.5 py-1 border border-border text-[11px] font-semibold text-muted-foreground bg-white rounded-md hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          disabled={isPlayerPending}
                          className="px-2.5 py-1 border border-red-200 text-[11px] font-semibold text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          제거
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
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
            📊 구단 현황 관리
          </p>
          <div className="bg-white border border-border rounded-2xl p-4">
            <form onSubmit={handleClubStatusSubmit} className="space-y-2.5">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="league_rank" className="text-[11px] font-semibold text-muted-foreground">
                    리그 순위
                  </label>
                  <input
                    id="league_rank"
                    name="league_rank"
                    type="number"
                    defaultValue={clubStatus?.league_rank ?? ''}
                    min={1}
                    max={20}
                    className="input-field mt-0.5"
                    placeholder="4"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="next_match_venue" className="text-[11px] font-semibold text-muted-foreground">
                    홈/원정
                  </label>
                  <select
                    id="next_match_venue"
                    name="next_match_venue"
                    defaultValue={clubStatus?.next_match_venue ?? ''}
                    className="input-field mt-0.5"
                  >
                    <option value="">선택</option>
                    <option value="home">홈</option>
                    <option value="away">원정</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="next_match_opponent" className="text-[11px] font-semibold text-muted-foreground">
                  다음 경기 상대
                </label>
                <input
                  id="next_match_opponent"
                  name="next_match_opponent"
                  defaultValue={clubStatus?.next_match_opponent ?? ''}
                  className="input-field mt-0.5"
                  placeholder="맨체스터 시티"
                />
              </div>
              <div>
                <label htmlFor="next_match_date" className="text-[11px] font-semibold text-muted-foreground">
                  경기 일시
                </label>
                <input
                  id="next_match_date"
                  name="next_match_date"
                  defaultValue={clubStatus?.next_match_date ?? ''}
                  className="input-field mt-0.5"
                  placeholder="예: 5월 31일 토"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[12px] font-bold text-foreground mb-2">시즌 스탯 대표 선수</p>
                {([
                  { label: '최다 출전', idKey: 'top_appearances_player_id', countKey: 'top_appearances_count', placeholder: '횟수', defaultId: clubStatus?.top_appearances_player_id, defaultCount: clubStatus?.top_appearances_count },
                  { label: '최다 득점', idKey: 'top_goals_player_id',       countKey: 'top_goals_count',       placeholder: '골',   defaultId: clubStatus?.top_goals_player_id,       defaultCount: clubStatus?.top_goals_count },
                  { label: '최다 어시', idKey: 'top_assists_player_id',     countKey: 'top_assists_count',     placeholder: '어시', defaultId: clubStatus?.top_assists_player_id,     defaultCount: clubStatus?.top_assists_count },
                ] as const).map(({ label, idKey, countKey, placeholder, defaultId, defaultCount }) => (
                  <div key={idKey} className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted-foreground w-14 flex-shrink-0">{label}</span>
                    <select
                      name={idKey}
                      defaultValue={defaultId ?? ''}
                      className="input-field flex-1 text-[12px]"
                    >
                      <option value="">선수 선택</option>
                      {activePlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.squad_number ? `#${p.squad_number} ` : ''}{p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      name={countKey}
                      type="number"
                      defaultValue={defaultCount ?? ''}
                      className="input-field w-14 text-center text-[12px]"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isClubPending} className="btn-secondary">
                저장하기
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
