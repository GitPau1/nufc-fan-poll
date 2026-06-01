import { getTransferClubLabel, getTransferClubPrefix, getTransferDirectionLabel } from '@/lib/transfers/format'
import type { TransferItem } from '@/lib/queries/transfers'

export function TransferListItem({ transfer, compact = false }: { transfer: TransferItem; compact?: boolean }) {
  const directionLabel = getTransferDirectionLabel(transfer.direction)
  const clubPrefix = getTransferClubPrefix(transfer.direction)
  const clubLabel = getTransferClubLabel(transfer.club_name)

  return (
    <article className={`relative flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-white text-center ${compact ? 'min-h-[142px] px-3 py-4' : 'min-h-[180px] px-4 py-5'}`}>
      <span className={`absolute font-black uppercase tracking-[0.14em] text-primary ${compact ? 'left-3 top-3 text-[10px]' : 'left-4 top-4 text-[12px]'}`}>
        {directionLabel}
      </span>
      <div className={`flex items-center justify-center overflow-hidden rounded-full bg-secondary font-black text-primary ${compact ? 'h-12 w-12 text-[12px]' : 'h-16 w-16 text-[14px]'}`}>
        {transfer.player?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={transfer.player.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          transfer.player?.name?.slice(0, 2) ?? '--'
        )}
      </div>
      <p className={`font-black text-foreground ${compact ? 'mt-2 max-w-full truncate text-[13px]' : 'mt-3 text-[15px]'}`}>
        {transfer.player?.name ?? '정보 없는 선수'}
      </p>
      <p className={`mt-1 max-w-full truncate font-semibold text-muted-foreground ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
        {clubPrefix} {clubLabel}
      </p>
    </article>
  )
}
