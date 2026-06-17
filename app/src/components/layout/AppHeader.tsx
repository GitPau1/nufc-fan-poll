import Link from 'next/link'
import type { HeaderAuth } from '@/lib/actions/auth'
import { HeaderAuthStatus } from './HeaderAuthStatus'

type AppHeaderProps = {
  auth?: HeaderAuth | null
  showAuth?: boolean
  centerLogo?: boolean
}

export function AppHeader({ auth, showAuth = true, centerLogo = false }: AppHeaderProps = {}) {
  return (
    <header className={`sticky top-0 z-50 w-full bg-surface ${centerLogo ? '' : 'border-b border-border'}`}>
      <div className={`flex items-center px-4 ${centerLogo ? 'h-[62px] justify-center' : 'h-14 justify-between'}`}>
        <Link href="/" className="flex items-center">
          <span className={`${centerLogo ? 'text-[24px] leading-[22.5px] text-[#2b2b2b]' : 'text-[20px] leading-[22px] text-foreground'} font-black`}>
            NUFCVOTE
          </span>
        </Link>

        {showAuth && <HeaderAuthStatus auth={auth} />}
      </div>
    </header>
  )
}
