import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { FarewellCommentsSection } from '@/components/farewells/FarewellCommentsSection'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getFarewellById, getFarewellComments } from '@/lib/queries/farewells'
import { IS_MOCK } from '@/lib/config'

interface FarewellPageProps {
  params: Promise<{ id: string }>
}

const DEPARTURE_LABEL = {
  released: '방출',
  transferred: '이적',
  loan_end: '임대 종료',
  retired: '은퇴',
} as const

function StatLabel({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-[76px] flex-1 rounded-xl border border-border bg-white px-3 py-3 text-center">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="text-xl font-black text-foreground mt-1">{value ?? '-'}</p>
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function FarewellPage({ params }: FarewellPageProps) {
  const { id } = await params

  let user = null
  if (IS_MOCK) {
    const cookieStore = await cookies()
    if (cookieStore.get('mock-auth')?.value === 'true') {
      user = { id: 'mock-user' }
    }
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  const farewell = await getFarewellById(id)
  if (!farewell) notFound()

  const comments = await getFarewellComments(id)
  const player = farewell.player
  const joinedAt = formatDate(farewell.joined_at)
  const leftAt = formatDate(farewell.left_at)
  const stats = [
    { label: '출전', value: farewell.appearances },
    { label: '골', value: farewell.goals },
    { label: '도움', value: farewell.assists },
    ...(player?.position === 'GK' ? [{ label: '클린시트', value: farewell.clean_sheets }] : []),
  ]

  return (
    <>
      <AppHeader />
      <main className="px-4 pt-4 pb-24 animate-enter">
        <Card className="rounded-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                {player?.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-black text-primary">{player?.squad_number ?? 'FW'}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <Badge className="bg-primary text-white border-0 hover:bg-primary pointer-events-none">
                    작별
                  </Badge>
                  <Badge variant="secondary" className="pointer-events-none">
                    {DEPARTURE_LABEL[farewell.departure_type]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                  {player?.name ?? 'Departing player'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {player?.position ?? 'Player'}
                  {player?.nationality ? ` · ${player.nationality}` : ''}
                </p>
                <p className="text-sm font-semibold text-foreground mt-2">
                  {farewell.destination_club ? `행선지: ${farewell.destination_club}` : '행선지 미정'}
                </p>
              </div>
            </div>

            {farewell.departure_note && (
              <p className="text-sm text-foreground leading-relaxed mt-4">
                {farewell.departure_note}
              </p>
            )}

            {(joinedAt || leftAt) && (
              <p className="text-[12px] text-muted-foreground mt-3">
                {joinedAt ?? '-'}부터 {leftAt ?? '-'}까지
              </p>
            )}
          </div>
        </Card>

        <section className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5 mb-2">
            Newcastle Career
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stats.map(stat => (
              <StatLabel key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <FarewellCommentsSection
            farewellId={farewell.id}
            initialComments={comments}
            isAuthenticated={!!user}
            isMockMode={IS_MOCK}
          />
        </section>
      </main>
    </>
  )
}
