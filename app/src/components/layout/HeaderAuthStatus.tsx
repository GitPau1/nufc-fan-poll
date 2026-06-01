'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoginButton } from './LoginButton'
import { UserMenu } from './UserMenu'

type HeaderUser = {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string | null
  }
}

export function HeaderAuthStatus() {
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [displayName, setDisplayName] = useState<string | undefined>()
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (cancelled || !data.user) return

      setUser(data.user)
      setAvatarUrl(data.user.user_metadata?.avatar_url ?? undefined)

      const { data: profile } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', data.user.id)
        .single()

      if (cancelled) return
      setDisplayName(profile?.display_name ?? data.user.user_metadata?.name ?? undefined)
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return <LoginButton />

  return <UserMenu avatarUrl={avatarUrl} displayName={displayName} isAdmin={false} />
}
