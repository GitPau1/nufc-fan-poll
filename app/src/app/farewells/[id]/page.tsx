import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellCommentsSection } from '@/components/farewells/FarewellCommentsSection'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getHeaderAuth } from '@/lib/actions/auth'
import { getFarewellById, getFarewellComments, getPlayerSeasonStats } from '@/lib/queries/farewells'
import { IS_MOCK } from '@/lib/config'

interface FarewellPageProps {
  params: Promise<{ id: string }>
}

const DEPARTURE_LABEL = {
  signing: '영입',
  loan_in: '임대',
  promotion: '승격',
  loan_return: '임대 복귀',
  transferred: '이적',
  contract_expired: '계약 만료',
  loan_out: '임대',
  released: '방출',
} as const

function isIncoming(type: keyof typeof DEPARTURE_LABEL): boolean {
  return type === 'signing' || type === 'loan_in' || type === 'loan_return' || type === 'promotion'
}

function StatLabel({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-[76px] flex-1 rounded-md border border-border bg-surface px-3 py-3 text-center shadow-g200">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="text-xl font-black text-foreground mt-1">{value ?? '-'}</p>
    </div>
  )
}

function formatYear(date: string | null) {
  if (!date) return null
  const year = new Date(date).getFullYear()
  return Number.isNaN(year) ? null : String(year)
}

export default async function FarewellPage({ params }: FarewellPageProps) {
  const { id } = await params

  const [farewell, auth] = await Promise.all([
    getFarewellById(id),
    getHeaderAuth(),
  ])
  if (!farewell) notFound()

  const [comments, seasonStats] = await Promise.all([
    getFarewellComments(id),
    getPlayerSeasonStats(farewell.player_id),
  ])
  const player = farewell.player
  const joinedYear = formatYear(farewell.joined_at)
  const leftYear = formatYear(farewell.left_at)
  const period = joinedYear || leftYear ? `${joinedYear ?? '-'} - ${leftYear ?? '-'}` : null
  const career = seasonStats.reduce(
    (total, stat) => ({
      appearances: total.appearances + stat.appearances,
      goals: total.goals + stat.goals,
      assists: total.assists + stat.assists,
    }),
    { appearances: 0, goals: 0, assists: 0 },
  )
  const hasSeasonStats = seasonStats.length > 0
  const stats = [
    { label: '출전', value: hasSeasonStats ? career.appearances : farewell.appearances },
    { label: '골', value: hasSeasonStats ? career.goals : farewell.goals },
    { label: '도움', value: hasSeasonStats ? career.assists : farewell.assists },
    ...(player?.position === 'GK' ? [{ label: '클린시트', value: farewell.clean_sheets }] : []),
  ]

  return (
    <>
      <AppHeader auth={auth} />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-disabled flex-shrink-0">
                {player?.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-dim flex items-center justify-center">
                    <span className="text-2xl font-black text-primary">{player?.squad_number ?? 'TR'}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <Badge className={`${isIncoming(farewell.departure_type) ? 'bg-positive-dim text-positive hover:bg-positive-dim' : 'bg-primary-dim text-primary-dark hover:bg-primary-dim'} border-0 pointer-events-none`}>
                    {isIncoming(farewell.departure_type) ? '영입' : '이적'}
                  </Badge>
                  <Badge variant="secondary" className="pointer-events-none">
                    {DEPARTURE_LABEL[farewell.departure_type]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                  {player?.name ?? 'Transfer player'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {player?.position ?? 'Player'}
                  {player?.nationality ? ` · ${player.nationality}` : ''}
                </p>
                <p className="text-sm font-semibold text-foreground mt-2">
                  {farewell.destination_club ? `구단: ${farewell.destination_club}` : '구단 미정'}
                </p>
                {period && (
                  <p className="text-[12px] text-muted-foreground mt-2">
                    {period}
                  </p>
                )}
              </div>
            </div>

            {farewell.departure_note && (
              <p className="text-sm text-foreground leading-relaxed mt-4">
                {farewell.departure_note}
              </p>
            )}
          </div>
        </Card>

        <section className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5 mb-2">
            Career
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stats.map(stat => (
              <StatLabel key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          {seasonStats.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface shadow-g200">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold">시즌</th>
                    <th className="px-3 py-2 text-right font-bold">출전</th>
                    <th className="px-3 py-2 text-right font-bold">골</th>
                    <th className="px-3 py-2 text-right font-bold">도움</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {seasonStats.map(stat => (
                    <tr key={stat.id}>
                      <td className="px-3 py-2 font-semibold text-foreground">{stat.season}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{stat.appearances}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{stat.goals}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{stat.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-5">
          <FarewellCommentsSection
            farewellId={farewell.id}
            initialComments={comments}
            isAuthenticated={!!auth}
            isMockMode={IS_MOCK}
          />
        </section>
      </main>
    </>
  )
}
