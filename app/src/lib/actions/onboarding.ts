'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { IS_MOCK } from '@/lib/config'

export async function saveNickname(formData: FormData): Promise<{ error?: string }> {
  const displayName = (formData.get('displayName') as string)?.trim()

  if (!displayName || displayName.length < 2 || displayName.length > 12) {
    return { error: '닉네임은 2~12자로 입력해주세요.' }
  }
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(displayName)) {
    return { error: '특수문자는 사용할 수 없어요.' }
  }

  if (IS_MOCK) {
    const cookieStore = await cookies()
    cookieStore.set('mock-display-name', displayName, { path: '/', httpOnly: true, sameSite: 'lax' })
    redirect('/')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: '저장에 실패했어요. 다시 시도해주세요.' }

  redirect('/')
}
