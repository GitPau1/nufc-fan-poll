import { AppHeader } from '@/components/layout/AppHeader'
import { PostFeedClient } from '@/components/posts/PostFeedClient'
import { getPublicPostList } from '@/lib/queries/posts'

export const revalidate = 30

export default async function PostsPage() {
  const posts = await getPublicPostList()

  return (
    <>
      <AppHeader />
      <main className="pb-24">
        <PostFeedClient initialPosts={posts} />
      </main>
    </>
  )
}
