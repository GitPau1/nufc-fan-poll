import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlayerCommentsSection } from '@/components/club/PlayerCommentsSection'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getHeaderAuth } from '@/lib/actions/auth'
import { getPlayerById, getPlayerComments, getPlayerStats } from '@/lib/queries/club'

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

const STATUS_LABEL = {
  first_team: '현재 선수',
  loan: '임대',
  u21: 'U21',
} as const

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
  return hasBirthdayPassed ? age : age - 1
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3 text-center shadow-g200">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black text-foreground">{value}</p>
    </div>
  )
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params
  const [player, stats, comments, auth] = await Promise.all([
    getPlayerById(id),
    getPlayerStats(id),
    getPlayerComments(id),
    getHeaderAuth(),
  ])
  if (!player) notFound()

  const [currentSeason, ...pastSeasons] = stats
  const age = calcAge(player.birth_date)

  return (
    <>
      <AppHeader auth={auth} />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-disabled flex-shrink-0">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-dim flex items-center justify-center">
                    <span className="text-2xl font-black text-primary">{player.squad_number ?? player.name.slice(0, 2)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge className="border-0 bg-primary text-white hover:bg-primary pointer-events-none">
                    {STATUS_LABEL[player.squad_status ?? 'first_team']}
                  </Badge>
                  {player.position && (
                    <Badge variant="secondary" className="pointer-events-none">
                      {player.position}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                  {player.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {player.squad_number ? `#${player.squad_number}` : '등번호 미정'}
                  {player.nationality ? ` · ${player.nationality}` : ''}
                  {age != null ? ` · ${age}세` : ''}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <section className="mt-4">
          <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Season
          </p>
          {currentSeason ? (
            <>
              <p className="mb-2 text-[13px] font-bold text-foreground">{currentSeason.season}</p>
              <div className="grid grid-cols-3 gap-2">
                <StatBox label="출전" value={currentSeason.appearances} />
                <StatBox label="골" value={currentSeason.goals} />
                <StatBox label="도움" value={currentSeason.assists} />
              </div>
            </>
          ) : (
            <div className="rounded-md border border-border bg-surface px-4 py-5 text-center shadow-g200">
              <p className="text-[13px] font-semibold text-muted-foreground">등록된 시즌 기록이 없어요.</p>
            </div>
          )}
        </section>

        {pastSeasons.length > 0 && (
          <section className="mt-4">
            <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Past Seasons
            </p>
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-g200">
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
                  {pastSeasons.map(stat => (
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
          </section>
        )}

        <section className="mt-5">
          <PlayerCommentsSection
            playerId={player.id}
            initialComments={comments}
            isAuthenticated={!!auth}
          />
        </section>
      </main>
    </>
  )
}
