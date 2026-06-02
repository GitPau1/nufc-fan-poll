'use client'

import { type FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FEEDBACK_MAX_LENGTH } from '@/lib/feedback'
import { cn } from '@/lib/utils'

interface MyFeedbackFormProps {
  isMockMode: boolean
}

export function MyFeedbackForm({ isMockMode }: MyFeedbackFormProps) {
  const [feedbackValue, setFeedbackValue] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmittingFeedback, startFeedbackTransition] = useTransition()

  function handleSubmitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = feedbackValue.trim()
    if (!content) {
      setFeedbackStatus({ type: 'error', message: '피드백을 입력해주세요.' })
      return
    }

    setFeedbackStatus(null)
    startFeedbackTransition(async () => {
      const { submitFeedback } = await import('@/lib/actions/feedback')
      const result = await submitFeedback(content)
      if ('error' in result) {
        setFeedbackStatus({ type: 'error', message: result.error })
        return
      }

      setFeedbackValue('')
      setFeedbackStatus({
        type: 'success',
        message: isMockMode
          ? '데모 모드에서는 저장되지 않아요.'
          : '피드백이 전송됐어요.',
      })
    })
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="px-4 pt-6 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="마이페이지로 돌아가기">
            <Link href="/my">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              피드백
            </p>
            <h1 className="text-xl font-black text-foreground">피드백 남기기</h1>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-3">
          <Card>
            <CardContent className="p-4 flex flex-col gap-3">
              <textarea
                value={feedbackValue}
                onChange={event => {
                  setFeedbackValue(event.target.value)
                  if (feedbackStatus) setFeedbackStatus(null)
                }}
                maxLength={FEEDBACK_MAX_LENGTH}
                rows={8}
                placeholder="의견을 입력해주세요"
                className="w-full resize-none rounded-sm border border-gray-4 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="min-h-5 flex-1">
                  {feedbackStatus && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        feedbackStatus.type === 'success' ? 'text-primary' : 'text-negative',
                      )}
                    >
                      {feedbackStatus.message}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {feedbackValue.length}/{FEEDBACK_MAX_LENGTH}
                </span>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmittingFeedback || !feedbackValue.trim()}
              >
                <Send className="h-4 w-4" />
                {isSubmittingFeedback ? '전송 중' : '피드백 보내기'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
