import type { HeaderAuth } from '@/lib/actions/auth'
import { LoginButton } from './LoginButton'
import { UserMenu } from './UserMenu'

export function HeaderAuthStatus({ auth }: { auth: HeaderAuth | null }) {
  if (!auth) return <LoginButton />

  return <UserMenu avatarUrl={auth.avatarUrl} displayName={auth.displayName} isAdmin={auth.isAdmin} />
}
