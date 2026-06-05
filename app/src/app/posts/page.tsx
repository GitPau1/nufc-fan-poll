import { AppHeader } from '@/components/layout/AppHeader'
import { PostFeedClient } from '@/components/posts/PostFeedClient'
import { getHeaderAuth } from '@/lib/actions/auth'
import { getPostList } from '@/lib/queries/posts'

export const revalidate = 30

export default async function PostsPage() {
  const auth = await getHeaderAuth()
  const userId = auth?.userId ?? null
  const isLoggedIn = Boolean(auth)
  const posts = await getPostList(userId)

  return (
    <>
      <AppHeader auth={auth} />
      <main className="pb-24">
        <PostFeedClient initialPosts={posts} isLoggedIn={isLoggedIn} />
      </main>
    </>
  )
}
