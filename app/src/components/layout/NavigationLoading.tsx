'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const MIN_VISIBLE_MS = 350
const FALLBACK_HIDE_MS = 4000

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

export function NavigationLoading() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const startedAtRef = useRef(0)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return

      const anchor = (event.target as Element | null)?.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const nextUrl = new URL(anchor.href)
      if (nextUrl.origin !== window.location.origin) return

      const current = window.location.pathname + window.location.search
      const next = nextUrl.pathname + nextUrl.search
      if (next === current) return
      if (nextUrl.hash && nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return

      startedAtRef.current = Date.now()
      setIsLoading(true)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    if (!isLoading) return

    const elapsed = Date.now() - startedAtRef.current
    const hideDelay = Math.max(MIN_VISIBLE_MS - elapsed, 0)
    const hideTimer = window.setTimeout(() => setIsLoading(false), hideDelay)
    return () => window.clearTimeout(hideTimer)
  }, [pathname, isLoading])

  useEffect(() => {
    if (!isLoading) return

    const fallbackTimer = window.setTimeout(() => setIsLoading(false), FALLBACK_HIDE_MS)
    return () => window.clearTimeout(fallbackTimer)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      role="status"
      aria-label="페이지를 불러오는 중"
      className="fixed inset-x-0 top-0 z-50 mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background/95 backdrop-blur-sm"
    >
      <div className="h-1 w-full overflow-hidden bg-disabled">
        <div className="h-full w-1/2 animate-[loading-bar_1s_ease-in-out_infinite] rounded-r-pill bg-primary" />
      </div>

      <div aria-hidden="true" className="flex-1 px-4 pb-24 pt-4">
        <div className="h-[252px] overflow-hidden rounded-lg bg-surface shadow-w200">
          <div className="h-full animate-skeleton bg-disabled" />
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface p-px">
          <div className="flex px-3 pt-4">
            <div className="h-8 flex-1 border-b border-primary" />
            <div className="h-8 flex-1 border-b border-border" />
            <div className="h-8 flex-1 border-b border-border" />
          </div>

          <div className="divide-y divide-border">
            {[0, 1, 2].map(index => (
              <div key={index} className="flex h-32 items-center gap-4 py-4 pl-3 pr-5">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-disabled">
                  <div className="h-full w-full animate-skeleton" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="h-5 w-16 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                  <div className="h-4 w-4/5 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                  <div className="h-3 w-3/5 rounded-pill bg-disabled">
                    <div className="h-full w-full animate-skeleton rounded-pill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">페이지를 불러오는 중</span>
    </div>
  )
}
