'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/',     label: '투표',     emoji: '🗳' },
  { href: '/club', label: '구단 정보', emoji: '⚽' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  // Hide on login and onboarding pages
  if (pathname === '/login' || pathname === '/onboarding') return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/97 border-t border-border z-40">
      <div className="flex pb-4 pt-2">
        {ITEMS.map(({ href, label, emoji }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <span className="text-[20px] leading-none">{emoji}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
