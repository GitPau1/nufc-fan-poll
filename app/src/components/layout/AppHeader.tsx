import Link from 'next/link'
import { HeaderAuthStatus } from './HeaderAuthStatus'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-[15px] font-black tracking-tight text-foreground">
            NUFCVOTE
          </span>
        </Link>

        <HeaderAuthStatus />
      </div>
    </header>
  )
}
