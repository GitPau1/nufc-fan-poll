import Link from 'next/link'
import { cookies } from 'next/headers'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'
import { LoginButton } from './LoginButton'
import { UserMenu } from './UserMenu'

export async function AppHeader() {
  let user: { id: string; email?: string; user_metadata?: { name?: string; avatar_url?: string | null } } | null = null
  let userEmail: string | null = null

  if (IS_MOCK) {
    const cookieStore = await cookies()
    if (cookieStore.get('mock-auth')?.value === 'true') {
      user = { id: 'mock-user', user_metadata: { name: '뉴캐슬 팬', avatar_url: null } }
      userEmail = 'mock@example.com'
    }
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    userEmail = data.user?.email ?? null
  }

  const avatarUrl   = user?.user_metadata?.avatar_url ?? undefined
  const displayName = user?.user_metadata?.name ?? undefined
  const admin = isAdmin(userEmail)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-[15px] font-black tracking-tight text-foreground">
            NUFCVOTE
          </span>
        </Link>

        {user ? (
          <UserMenu avatarUrl={avatarUrl} displayName={displayName} isAdmin={admin} />
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  )
}
