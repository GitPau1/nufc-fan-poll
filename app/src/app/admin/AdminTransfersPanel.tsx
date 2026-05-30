'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { restorePlayerFromFarewell, updateFarewell } from '@/lib/actions/farewells'
import type { DepartureType } from '@/types/database'

export interface AdminFarewell {
  id: string
  player_id: string
  departure_type: string
  destination_club: string | null
  departure_note: string | null
  created_at: string
  player: { id: string; name: string; squad_number: number | null; photo_url: string | null } | null
}

const TRANSFER_LABEL: Record<DepartureType, string> = {
  signing: '영입',
  loan_in: '임대 영입',
  promotion: '승격',
  loan_return: '임대 복귀',
  transferred: '이적',
  contract_expired: '계약 만료',
  loan_out: '임대',
  released: '방출',
}

interface Props {
  farewells: AdminFarewell[]
  onToast: (text: string, type?: 'ok' | 'err') => void
}

export function AdminTransfersPanel({ farewells, onToast }: Props) {
  const router = useRouter()
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpdateTransfer(e: React.FormEvent<HTMLFormElement>, farewell: AdminFarewell) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const type = String(fd.get('departure_type'))

    if (type === 'contract_expired') {
      fd.set('destination_club', 'FA')
    }

    if ((type === 'transferred' || type === 'loan_out') && !String(fd.get('destination_club') ?? '').trim()) {
      onToast('이적 또는 임대는 구단 명을 입력해주세요.', 'err')
      return
    }

    startTransition(async () => {
      const result = await updateFarewell(farewell.id, fd)
      if (result.error) {
        onToast(result.error, 'err')
        return
      }

      onToast('이적 정보가 수정됐어요.')
      setEditingTransferId(null)
      router.refresh()
    })
  }

  function handleRestoreTransfer(farewell: AdminFarewell) {
    if (!farewell.player_id) return
    if (!confirm('이 선수를 1군으로 복귀시킬까요?')) return

    startTransition(async () => {
      const result = await restorePlayerFromFarewell(farewell.id, farewell.player_id)
      if (result.error) {
        onToast(result.error, 'err')
        return
      }

      onToast('선수가 1군으로 복귀됐어요.')
      router.refresh()
    })
  }

  return (
    <section>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">이적 관리</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3.5">
          <p className="text-[14px] font-bold text-foreground">팀을 떠난 선수</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">이적 정보를 수정하거나 선수를 1군으로 복귀시킵니다.</p>
        </div>
        {farewells.length === 0 ? (
          <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">등록된 이적 이벤트가 없어요.</p>
        ) : (
          <div className="divide-y divide-border">
            {farewells.map(farewell => {
              const type = farewell.departure_type as DepartureType
              return (
                <div key={farewell.id} className="px-4 py-3">
                  {editingTransferId === farewell.id ? (
                    <form onSubmit={e => handleUpdateTransfer(e, farewell)} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <select name="departure_type" defaultValue={farewell.departure_type} className="input-field">
                          <option value="transferred">이적</option>
                          <option value="contract_expired">계약 만료</option>
                          <option value="loan_out">임대</option>
                          <option value="released">방출</option>
                        </select>
                        <input name="destination_club" defaultValue={farewell.destination_club ?? ''} className="input-field" placeholder="구단 명 또는 FA" />
                      </div>
                      <textarea name="departure_note" rows={3} defaultValue={farewell.departure_note ?? ''} className="input-field resize-none" placeholder="이적 메모" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-primary py-2 text-[12px] font-bold text-white">저장</button>
                        <button type="button" onClick={() => setEditingTransferId(null)} className="flex-1 rounded-lg bg-secondary py-2 text-[12px] font-semibold text-foreground">취소</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-foreground">{farewell.player?.name ?? '정보 없는 선수'}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{TRANSFER_LABEL[type] ?? farewell.departure_type} · {farewell.destination_club ?? '행선지 미정'}</p>
                        {farewell.departure_note && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{farewell.departure_note}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => setEditingTransferId(farewell.id)} className="rounded-lg bg-secondary px-3 py-2 text-[12px] font-bold text-foreground">
                        수정
                      </button>
                      <button type="button" onClick={() => handleRestoreTransfer(farewell)} className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white">
                        복귀
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
