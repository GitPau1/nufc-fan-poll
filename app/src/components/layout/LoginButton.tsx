'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LoginButton() {
  return (
    <Link href="/login">
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-full text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
      >
        로그인
      </Button>
    </Link>
  )
}
