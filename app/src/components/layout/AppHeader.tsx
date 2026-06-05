import Link from 'next/link'
import { getHeaderAuth, type HeaderAuth } from '@/lib/actions/auth'
import { HeaderAuthStatus } from './HeaderAuthStatus'

type AppHeaderProps = {
  auth?: HeaderAuth | null
}

export async function AppHeader({ auth: initialAuth }: AppHeaderProps = {}) {
  const auth = initialAuth === undefined ? await getHeaderAuth() : initialAuth

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-[15px] font-black tracking-tight text-foreground">
            NUFCVOTE
          </span>
        </Link>

        <HeaderAuthStatus auth={auth} />
      </div>
    </header>
  )
}
