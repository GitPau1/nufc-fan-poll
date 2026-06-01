'use client'

import { useEffect, useState } from 'react'
import { getHeaderAuth, type HeaderAuth } from '@/lib/actions/auth'
import { LoginButton } from './LoginButton'
import { UserMenu } from './UserMenu'

export function HeaderAuthStatus() {
  const [auth, setAuth] = useState<HeaderAuth | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      const nextAuth = await getHeaderAuth()
      if (!cancelled) setAuth(nextAuth)
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  if (!auth) return <LoginButton />

  return <UserMenu avatarUrl={auth.avatarUrl} displayName={auth.displayName} isAdmin={auth.isAdmin} />
}
