import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NUFC Vote',
  description: '뉴캐슬 유나이티드 팬 투표 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-background min-h-screen">
        <div className="max-w-[480px] mx-auto min-h-screen bg-background relative">
          {children}
        </div>
      </body>
    </html>
  )
}
