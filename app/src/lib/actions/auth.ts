'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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
