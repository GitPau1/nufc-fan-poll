'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IS_MOCK } from '@/lib/config'
import { mockLogin } from '@/lib/actions/auth'

export function LoginButton() {
  const pathname = usePathname()

  async function handleLogin() {
    if (IS_MOCK) {
      await mockLogin()
      return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}`,
      },
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogin}
      className="h-8 rounded-pill text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
    >
      로그인
    </Button>
  )
}
