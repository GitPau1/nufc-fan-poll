import { cookies } from 'next/headers'
import { AppHeader } from '@/components/layout/AppHeader'
import { PostFeedClient } from '@/components/posts/PostFeedClient'
import { IS_MOCK } from '@/lib/config'
import { getPostList } from '@/lib/queries/posts'

export const revalidate = 30

export default async function PostsPage() {
  let userId: string | null = null
  let isLoggedIn = false

  if (IS_MOCK) {
    const cookieStore = await cookies()
    isLoggedIn = cookieStore.get('mock-auth')?.value === 'true'
    userId = isLoggedIn ? 'mock-user' : null
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
    isLoggedIn = Boolean(user)
  }

  const posts = await getPostList(userId)

  return (
    <>
      <AppHeader />
      <main className="pb-24">
        <PostFeedClient initialPosts={posts} isLoggedIn={isLoggedIn} />
      </main>
    </>
  )
}
