'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Trash2, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { ParticipatedPoll } from '@/lib/mock/data'
import { cn } from '@/lib/utils'

interface MyPageClientProps {
  displayName: string
  email: string
  avatarUrl: string | null
  participatedPolls: ParticipatedPoll[]
  isMockMode: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function MyPageClient({
  displayName,
  email,
  avatarUrl,
  participatedPolls,
  isMockMode,
}: MyPageClientProps) {
  const router = useRouter()

  const [nameValue, setNameValue]         = useState(displayName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editInput, setEditInput]         = useState(displayName)

  const initial = nameValue[0]?.toUpperCase() ?? 'U'

  function startEdit() {
    setEditInput(nameValue)
    setIsEditingName(true)
  }

  function cancelEdit() {
    setIsEditingName(false)
    setEditInput(nameValue)
  }

  async function handleSaveName() {
    const trimmed = editInput.trim()
    if (!trimmed) return
    // 낙관적 UI 업데이트
    setNameValue(trimmed)
    setIsEditingName(false)
    // public.users.display_name 저장
    const { updateNickname } = await import('@/lib/actions/onboarding')
    const result = await updateNickname(trimmed)
    if (result.error) {
      // 저장 실패 시 원래 값으로 복원
      setNameValue(displayName)
      alert(result.error)
    }
  }

  async function handleLogout() {
    if (isMockMode) {
      const { mockLogout } = await import('@/lib/actions/auth')
      await mockLogout()
      router.push('/')
      return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleDelete() {
    if (isMockMode) {
      alert('데모 모드에서는 지원하지 않습니다.')
      return
    }
    if (confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // submitDeleteAccount()
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-background">
      <div className="px-4 pt-6 pb-10 flex flex-col gap-5">

        {/* 프로필 */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* 닉네임 편집 */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={editInput}
                  onChange={e => setEditInput(e.target.value.slice(0, 20))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className="text-base font-black text-foreground bg-transparent border-b-2 border-primary
                             outline-none w-32 pb-0.5"
                  autoFocus
                  maxLength={20}
                />
                <button
                  onClick={handleSaveName}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-foreground truncate">{nameValue}</p>
                <button
                  onClick={startEdit}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="닉네임 수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <p className="text-sm text-muted-foreground">{email}</p>
            {isMockMode && (
              <Badge variant="secondary" className="text-[10px] mt-1">데모 프로필</Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* 참여한 투표 */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            참여한 투표 · {participatedPolls.length}개
          </p>

          {participatedPolls.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              아직 참여한 투표가 없습니다
            </p>
          ) : (
            <Card>
              <CardContent className="p-0">
                {participatedPolls.map((item, i) => (
                  <div key={item.pollId}>
                    {i > 0 && <Separator />}
                    <Link href={`/polls/${item.pollId}`} className="block active:bg-secondary/70 transition-colors">
                      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                            {item.pollTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-xs font-medium text-primary')}>
                              {item.optionLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              · {formatDate(item.votedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant={item.pollStatus === 'closed' ? 'outline' : 'secondary'}
                            className="text-[10px] pointer-events-none"
                          >
                            {item.pollStatus === 'closed' ? '종료' : '진행 중'}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* 계정 설정 */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-12"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-12 text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            회원 탈퇴
          </Button>
        </div>
      </div>
    </div>
  )
}
