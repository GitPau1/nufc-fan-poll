'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export function PollPageHeader() {
  const router = useRouter()
  return (
    <header className="w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="flex h-14 items-center px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground
                     hover:text-foreground active:opacity-50 transition-all duration-100 focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" />
          돌아가기
        </button>
      </div>
    </header>
  )
}
