'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getSourcePage, trackEvent } from '@/lib/analytics/mixpanel'

const RETURN_WINDOW_MS = 30 * 60 * 1000

export function AppAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    const sourcePage = getSourcePage(pathname)
    const lastSeenKey = 'nufc_vote_analytics_last_seen'
    const lastSeen = Number(localStorage.getItem(lastSeenKey) ?? 0)
    const now = Date.now()

    trackEvent('app_opened', { source_page: sourcePage })

    if (lastSeen > 0 && now - lastSeen > RETURN_WINDOW_MS) {
      trackEvent('return_visit', {
        source_page: sourcePage,
        hours_since_last_seen: Math.round((now - lastSeen) / 36_000) / 100,
      })
    }

    localStorage.setItem(lastSeenKey, String(now))
  }, [pathname])

  return null
}

export function PollFeedAnalytics({
  sourcePage,
  pollCount,
}: {
  sourcePage: string
  pollCount: number
}) {
  useEffect(() => {
    trackEvent('poll_feed_viewed', {
      source_page: sourcePage,
      poll_count: pollCount,
    })
  }, [sourcePage, pollCount])

  return null
}

