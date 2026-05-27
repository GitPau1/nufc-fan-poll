'use client'

import { useEffect, useState } from 'react'
import { formatDeadline } from '@/lib/utils'

export function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [text, setText] = useState(formatDeadline(closesAt))

  useEffect(() => {
    // D-N 표시면 1분마다, HH:MM:SS면 1초마다
    const isHourly = !text.startsWith('D-') && text !== '종료'
    const interval = isHourly ? 1000 : 60_000

    const timer = setInterval(() => setText(formatDeadline(closesAt)), interval)
    return () => clearInterval(timer)
  }, [closesAt, text])

  return <>{text}</>
}
