import { redirect } from 'next/navigation'
import { IS_MOCK } from '@/lib/config'
import { MyFeedbackForm } from '@/components/my/MyFeedbackForm'

export default async function MyFeedbackPage() {
  if (IS_MOCK) {
    return <MyFeedbackForm isMockMode={true} />
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return <MyFeedbackForm isMockMode={false} />
}
