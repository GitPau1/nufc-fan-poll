import Link from 'next/link'
import type { HeaderAuth } from '@/lib/actions/auth'
import { HeaderAuthStatus } from './HeaderAuthStatus'

type AppHeaderProps = {
  auth?: HeaderAuth | null
  showAuth?: boolean
  centerLogo?: boolean
}

export function AppHeader({ auth, showAuth = true }: AppHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e1e7ef] bg-gradient-to-b from-white to-white/75 backdrop-blur">
      <div className="relative flex h-[62px] items-center justify-center px-4">
        <Link href="/" className="flex items-center">
          <span className="text-[24px] font-black leading-[22.5px] text-[#2b2b2b]">
            NUFCVOTE
          </span>
        </Link>

        {showAuth && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <HeaderAuthStatus auth={auth} />
          </div>
        )}
      </div>
    </header>
  )
}
