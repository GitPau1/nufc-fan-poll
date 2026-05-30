'use client'

import { useState, useTransition } from 'react'
import { saveNickname } from '@/lib/actions/onboarding'

export default function OnboardingPage() {
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveNickname(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5 text-3xl border-2 border-border">
        🧑
      </div>

      <h1 className="text-xl font-black tracking-tight text-foreground text-center mb-1.5">
        팬 이름을 정해주세요
      </h1>
      <p className="text-[13px] text-muted-foreground text-center leading-relaxed mb-9">
        다른 팬들에게 이 이름으로 보여요.<br />
        나중에 마이페이지에서 변경 가능해요.
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-foreground">닉네임</label>
          <input
            name="displayName"
            className="w-full px-3.5 py-3 rounded-xl border-[1.5px] border-border text-[15px] text-foreground bg-white outline-none focus:border-primary placeholder:text-slate-300"
            placeholder="예: 까치사랑해"
            maxLength={12}
            autoFocus
          />
          <span className="text-[11px] text-muted-foreground">2~12자, 특수문자 제외</span>
          {error && <span className="text-[12px] text-red-500 font-medium">{error}</span>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[15px] hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
        >
          {isPending ? '저장 중...' : '시작하기 →'}
        </button>
      </form>
    </div>
  )
}
