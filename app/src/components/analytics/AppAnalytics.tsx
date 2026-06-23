'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getSourcePage, trackEvent } from '@/lib/analytics/mixpanel'

const RETURN_WINDOW_MS = 30 * 60 * 1000

export function AppAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    const sourcePage = getSourcePage(pathname)
    const sessionKey = 'nufc_vote_analytics_session_started'
    const lastSeenKey = 'nufc_vote_analytics_last_seen'
    const lastSeen = Number(localStorage.getItem(lastSeenKey) ?? 0)
    const now = Date.now()
    const isReturningSession = lastSeen > 0 && now - lastSeen > RETURN_WINDOW_MS
    const isNewSession = !sessionStorage.getItem(sessionKey) || isReturningSession

    if (isNewSession) {
      trackEvent('session_started', { source_page: sourcePage })
      sessionStorage.setItem(sessionKey, String(now))
    }
    trackEvent('screen_viewed', {
      source_page: sourcePage,
      pathname,
    })

    if (isReturningSession) {
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
  const initialPollCountRef = useRef(pollCount)

  useEffect(() => {
    const feedSeenKey = `nufc_vote_analytics_feed_seen:${sourcePage}`
    if (sessionStorage.getItem(feedSeenKey)) return

    sessionStorage.setItem(feedSeenKey, 'true')
    trackEvent('poll_feed_viewed', {
      source_page: sourcePage,
      poll_count: initialPollCountRef.current,
    })
  }, [sourcePage])

  return null
}
