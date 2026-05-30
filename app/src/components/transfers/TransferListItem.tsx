import { getTransferClubLabel, getTransferClubPrefix, getTransferDirectionLabel } from '@/lib/transfers/format'
import type { TransferItem } from '@/lib/queries/transfers'

export function TransferListItem({ transfer }: { transfer: TransferItem }) {
  const directionLabel = getTransferDirectionLabel(transfer.direction)
  const clubPrefix = getTransferClubPrefix(transfer.direction)
  const clubLabel = getTransferClubLabel(transfer.club_name)

  return (
    <article className="relative flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-white px-4 py-5 text-center">
      <span className="absolute left-4 top-4 text-[12px] font-black uppercase tracking-[0.14em] text-primary">
        {directionLabel}
      </span>
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary text-[14px] font-black text-primary">
        {transfer.player?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={transfer.player.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          transfer.player?.name?.slice(0, 2) ?? '--'
        )}
      </div>
      <p className="mt-3 text-[15px] font-black text-foreground">
        {transfer.player?.name ?? '정보 없는 선수'}
      </p>
      <p className="mt-1 text-[12px] font-semibold text-muted-foreground">
        {clubPrefix} {clubLabel}
      </p>
    </article>
  )
}
