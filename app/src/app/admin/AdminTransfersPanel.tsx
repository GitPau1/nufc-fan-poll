'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTransfer } from '@/lib/actions/admin'
import { restoreExternalPlayer } from '@/lib/actions/farewells'
import { splitTransfersByMovementGroup } from '@/lib/transfers/group'
import type { DepartureType } from '@/types/database'

export interface AdminTransferItem {
  id: string
  player_id: string
  direction: 'in' | 'out'
  transfer_type: string
  season: string
  season_id: string | null
  club_name: string | null
  note: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  movement_group: 'loan' | 'permanent'
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
  transfers: AdminTransferItem[]
  currentSeason: string
  currentSeasonId: string
  onToast: (text: string, type?: 'ok' | 'err') => void
}

const TRANSFER_SECTIONS: Array<{ key: 'permanent' | 'loan'; title: string }> = [
  { key: 'loan', title: '임대' },
  { key: 'permanent', title: '완전 이적' },
]

export function AdminTransfersPanel({ transfers, currentSeason, currentSeasonId, onToast }: Props) {
  const router = useRouter()
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null)
  const [restoringTransferId, setRestoringTransferId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const groupedTransfers = splitTransfersByMovementGroup(transfers)

  function handleUpdateTransfer(e: React.FormEvent<HTMLFormElement>, transfer: AdminTransferItem) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const type = String(fd.get('departure_type'))

    if (type === 'contract_expired') {
      fd.set('club_name', 'FA')
    }

    if ((type === 'transferred' || type === 'loan_out') && !String(fd.get('club_name') ?? '').trim()) {
      onToast('이적 또는 임대는 구단 명을 입력해주세요.', 'err')
      return
    }

    startTransition(async () => {
      fd.set('transfer_type', type)
      const result = await updateTransfer(transfer.id, fd)
      if (result.error) {
        onToast(result.error, 'err')
        return
      }

      onToast('이적 정보가 수정됐어요.')
      setEditingTransferId(null)
      router.refresh()
    })
  }

  function handleRestoreTransfer(e: React.FormEvent<HTMLFormElement>, transfer: AdminTransferItem) {
    e.preventDefault()
    if (!transfer.player_id) return
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      fd.set('player_id', transfer.player_id)
      fd.set('current_season', currentSeason)
      fd.set('current_season_id', currentSeasonId)
      if (!String(fd.get('club_name') ?? '').trim()) {
        fd.delete('club_name')
      }

      const result = await restoreExternalPlayer(fd)
      if (result.error) {
        onToast(result.error, 'err')
        return
      }

      onToast(fd.get('restore_only') === 'on' ? '선수가 단순 복귀 처리됐어요.' : '선수 복귀와 In 이력이 등록됐어요.')
      setRestoringTransferId(null)
      router.refresh()
    })
  }

  return (
    <section>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">이적 관리</p>
      <div className="space-y-3">
        {transfers.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="border-b border-border px-4 py-3.5">
              <p className="text-[14px] font-bold text-foreground">이번 시즌 이적</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">이적 정보를 수정하거나 선수를 1군으로 복귀시킵니다.</p>
            </div>
            <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">등록된 이적 이벤트가 없어요.</p>
          </div>
        ) : (
          TRANSFER_SECTIONS.map(section => {
            const items = groupedTransfers[section.key]
            return (
              <div key={section.key} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="border-b border-border px-4 py-3.5">
                  <p className="text-[14px] font-bold text-foreground">{section.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{items.length}건</p>
                </div>
                {items.length === 0 ? (
                  <p className="px-4 py-5 text-center text-[13px] text-muted-foreground">등록된 이적 이벤트가 없어요.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {items.map(transfer => {
                      const transferType = transfer.transfer_type as DepartureType
                      return (
                        <div key={transfer.id} className="px-4 py-3">
                          {editingTransferId === transfer.id ? (
                            <form onSubmit={e => handleUpdateTransfer(e, transfer)} className="space-y-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <select name="departure_type" defaultValue={transfer.transfer_type} className="input-field">
                                  <option value="transferred">이적</option>
                                  <option value="contract_expired">계약 만료</option>
                                  <option value="loan_out">임대</option>
                                  <option value="released">방출</option>
                                </select>
                                <input name="club_name" defaultValue={transfer.club_name ?? ''} className="input-field" placeholder="구단 명 또는 FA" />
                              </div>
                              <textarea name="note" rows={3} defaultValue={transfer.note ?? ''} className="input-field resize-none" placeholder="이적 메모" />
                              <div className="flex gap-2">
                                <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-primary py-2 text-[12px] font-bold text-white">저장</button>
                                <button type="button" onClick={() => setEditingTransferId(null)} className="flex-1 rounded-lg bg-secondary py-2 text-[12px] font-semibold text-foreground">취소</button>
                              </div>
                            </form>
                          ) : restoringTransferId === transfer.id ? (
                            <form onSubmit={e => handleRestoreTransfer(e, transfer)} className="space-y-2.5">
                              <label className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                                <input name="restore_only" type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                                단순 복귀로 처리
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <select name="transfer_type" defaultValue="signing" className="input-field">
                                  <option value="signing">재영입</option>
                                  <option value="loan_in">임대 복귀 후 재등록</option>
                                </select>
                                <input name="club_name" defaultValue={transfer.club_name ?? ''} className="input-field" placeholder="원소속 구단 또는 Free Agent" />
                              </div>
                              <textarea name="note" rows={3} defaultValue={transfer.note ?? ''} className="input-field resize-none" placeholder="복귀 메모" />
                              <div className="flex gap-2">
                                <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-primary py-2 text-[12px] font-bold text-white">복귀 저장</button>
                                <button type="button" onClick={() => setRestoringTransferId(null)} className="flex-1 rounded-lg bg-secondary py-2 text-[12px] font-semibold text-foreground">취소</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold text-foreground">{transfer.player?.name ?? '정보 없는 선수'}</p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">{TRANSFER_LABEL[transferType] ?? transfer.transfer_type} · {transfer.club_name ?? '행선지 미정'}</p>
                                {transfer.note && (
                                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{transfer.note}</p>
                                )}
                              </div>
                              {transfer.direction === 'out' && (
                                <button type="button" onClick={() => setEditingTransferId(transfer.id)} className="rounded-lg bg-secondary px-3 py-2 text-[12px] font-bold text-foreground">
                                  수정
                                </button>
                              )}
                              {transfer.direction === 'out' && (
                                <button type="button" onClick={() => setRestoringTransferId(transfer.id)} className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white">
                                  복귀
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
