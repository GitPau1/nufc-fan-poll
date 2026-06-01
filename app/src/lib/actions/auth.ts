'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { IS_MOCK } from '@/lib/config'
import { isAdmin } from '@/lib/admin'

export type HeaderAuth = {
  displayName?: string
  avatarUrl?: string
  isAdmin: boolean
}

type HeaderProfile = {
  display_name: string | null
}

export async function getHeaderAuth(): Promise<HeaderAuth | null> {
  if (IS_MOCK) {
    const cookieStore = await cookies()
    if (!cookieStore.get('mock-auth')) return null

    const adminEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim()
    const email = adminEmail || 'mock@example.com'

    return {
      displayName: 'Mock User',
      isAdmin: isAdmin(email),
    }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', data.user.id)
    .single<HeaderProfile>()

  return {
    displayName: profile?.display_name ?? data.user.user_metadata?.name ?? undefined,
    avatarUrl: data.user.user_metadata?.avatar_url ?? undefined,
    isAdmin: isAdmin(data.user.email),
  }
}

export async function mockLogin() {
  const cookieStore = await cookies()
  cookieStore.set('mock-auth', 'true', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7일
  })
  revalidatePath('/', 'layout')
}

export async function mockLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('mock-auth')
  revalidatePath('/', 'layout')
}
