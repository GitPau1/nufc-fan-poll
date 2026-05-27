import Link from 'next/link'
import { cookies } from 'next/headers'
import { IS_MOCK } from '@/lib/config'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoginButton } from './LoginButton'

export async function AppHeader() {
  let user: { id: string; user_metadata?: { name?: string; avatar_url?: string | null } } | null = null

  if (IS_MOCK) {
    const cookieStore = await cookies()
    if (cookieStore.get('mock-auth')?.value === 'true') {
      user = { id: 'mock-user', user_metadata: { name: '뉴캐슬 팬', avatar_url: null } }
    }
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const displayName = user?.user_metadata?.name as string | undefined

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
          <Link href="/my">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName ?? 'profile'} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {displayName?.[0]?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  )
}
