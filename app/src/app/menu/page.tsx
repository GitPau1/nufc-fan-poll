import Link from 'next/link'
import { LogIn, MessageSquareText } from 'lucide-react'
import MyPage from '@/app/my/page'
import { getHeaderAuth } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function MenuPage() {
  const auth = await getHeaderAuth()
  if (auth) return <MyPage />

  const feedbackEmail = process.env.ADMIN_EMAILS?.split(',')[0]?.trim()
  const feedbackHref = feedbackEmail
    ? `mailto:${feedbackEmail}?subject=${encodeURIComponent('NUFCVOTE 피드백')}`
    : '/login?next=/menu'

  return (
    <main className="min-h-[calc(100vh-56px)] px-4 pt-6 pb-24">
      <div className="mb-5">
        <p className="text-[20px] font-black leading-[26px] text-foreground">메뉴</p>
        <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
          로그인하면 내 투표와 참여 기록을 확인할 수 있어요.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-3">
          <Button asChild variant="outline" className="h-12 justify-start">
            <Link href={feedbackHref}>
              <MessageSquareText className="h-4 w-4" />
              피드백 남기기
            </Link>
          </Button>

          <Button asChild className="h-12 justify-start">
            <Link href="/login?next=/menu">
              <LogIn className="h-4 w-4" />
              로그인하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
