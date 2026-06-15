import Link from 'next/link'
import type { HeaderAuth } from '@/lib/actions/auth'
import { HeaderAuthStatus } from './HeaderAuthStatus'

type AppHeaderProps = {
  auth?: HeaderAuth | null
  showAuth?: boolean
}

export function AppHeader({ auth, showAuth = true }: AppHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="text-[20px] font-black leading-[22px] text-foreground">
            NUFCVOTE
          </span>
        </Link>

        {showAuth && <HeaderAuthStatus auth={auth} />}
      </div>
    </header>
  )
}
