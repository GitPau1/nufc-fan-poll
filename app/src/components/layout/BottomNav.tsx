'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Newspaper, Shield, Vote } from 'lucide-react'

const ITEMS = [
  { href: '/',      label: '홈',        Icon: Home },
  { href: '/polls', label: '투표',      Icon: Vote },
  { href: '/posts', label: '소식',      Icon: Newspaper },
  { href: '/club',  label: '구단 정보', Icon: Shield },
] as const

export function BottomNav() {
  const pathname = usePathname()

  if (pathname !== '/' && pathname !== '/polls' && pathname !== '/posts' && pathname !== '/club') return null

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface border-t border-border z-40">
      <div className="flex pb-4 pt-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
