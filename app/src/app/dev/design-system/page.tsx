import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Check,
  Clock,
  Heart,
  Home,
  Loader2,
  Lock,
  MessageCircle,
  Search,
  Send,
  Shield,
  Star,
  Trophy,
  User,
  Vote,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const foundationItems = [
  ['Overview', 'overview'],
  ['Colors', 'colors'],
  ['Typography', 'typography'],
  ['Layout & Breakpoints', 'layout-breakpoints'],
  ['Radius Tokens', 'radius-tokens'],
  ['Spacing Tokens', 'spacing-tokens'],
  ['States', 'states'],
]

const coreItems = [
  ['Button', 'button'],
  ['Chip / Badge', 'chip-badge'],
  ['Card', 'card'],
  ['Input', 'input'],
  ['Progress', 'progress'],
  ['Separator', 'separator'],
  ['Sheet / Modal', 'sheet-modal'],
  ['List Group', 'list-group'],
  ['Avatar', 'avatar'],
  ['Navigation', 'navigation'],
]

const serviceItems = [
  ['Poll Card', 'poll-card'],
  ['Poll Carousel Card', 'poll-carousel-card'],
  ['Poll Option', 'poll-option'],
  ['Result View', 'result-view'],
  ['Comment Item', 'comment-item'],
  ['Player Summary', 'player-summary'],
  ['Status Badge', 'status-badge'],
  ['Farewell Card', 'farewell-card'],
  ['Transfer Item', 'transfer-item'],
  ['Club Status', 'club-status'],
  ['Squad List', 'squad-list'],
  ['Rating Matrix', 'rating-matrix'],
  ['Form Section', 'form-section'],
]

const colorGroups = [
  {
    title: 'Background & Lines',
    description: '화면 배경, 카드 표면, 구분선에 사용하는 구조 색상입니다.',
    colors: [
      ['Background', '#fafafa', 'background', '앱 전체 배경'],
      ['Surface', '#ffffff', 'card / white', '카드, 목록, 헤더 표면'],
      ['Line default', '#e1e7ef', 'border', '기본 테두리와 구분선'],
      ['Line subtle', '#ebebeb', 'disabled', '옅은 구분선과 비활성 표면'],
    ],
  },
  {
    title: 'Label Color',
    description: '본문, 보조 설명, 메타 정보의 위계를 만드는 텍스트 색상입니다.',
    colors: [
      ['Label strong', '#111111', 'foreground', '본문과 주요 제목'],
      ['Label default', '#333333', 'gray-1', '일반 라벨'],
      ['Label muted', '#666666', 'muted-foreground', '보조 설명'],
      ['Label faint', '#a8a8a8', 'gray-3', '힌트와 메타 정보'],
    ],
  },
  {
    title: 'Primary Color',
    description: 'Newcastle 하늘색 기반의 브랜드 액션 색상입니다.',
    colors: [
      ['Primary', '#41b6e6', 'primary', '주요 CTA와 선택 상태'],
      ['Primary dim', 'rgba(65,182,230,.12)', 'primary/10', '선택된 항목의 옅은 배경'],
      ['Primary dark', '#1a9fd4', 'primary-dark', '옅은 primary 배경 위 텍스트'],
      ['Primary on', '#ffffff', 'primary-foreground', 'primary 배경 위 텍스트'],
    ],
  },
  {
    title: 'Status Color',
    description: '성공, 위험, 마감 등 상태를 표현하는 역할 색상입니다.',
    colors: [
      ['Positive', '#2e9e4f', 'positive', '완료와 긍정 상태'],
      ['Positive dim', '#e6f4ea', 'positive-dim', '긍정 상태의 옅은 배경'],
      ['Negative', '#d93025', 'destructive', '삭제와 위험 상태'],
      ['Negative dim', '#fce8e6', 'negative-dim', '위험 상태의 옅은 배경'],
    ],
  },
]

const typeScale = [
  ['title-xl', '20px', '700', '1.2', '랜딩 헤드라인'],
  ['title-l', '18px', '700', '1.25', '섹션 제목과 모달 타이틀'],
  ['title-m', '16px', '700', '1.3', '서브 헤더와 카드 제목'],
  ['title-s', '14px', '700', '1.35', '리스트 아이템 제목'],
  ['title-xs', '12px', '700', '1.4', '소형 라벨'],
  ['text-m', '15px', '700', '1.6', '버튼 라벨과 옵션 텍스트'],
  ['text-s', '14px', '400', '1.65', '본문, 댓글, 설명 텍스트'],
  ['text-xs', '12px', '400', '1.5', '부제와 메타 정보'],
  ['text-xxs', '11px', '600', '1.45', 'SECTION LABEL / BADGE'],
]

const layoutBreakpoints = [
  ['Mobile shell', '0-480px', '실제 서비스 기본 화면 폭. Root layout의 모바일 앱 쉘 기준입니다.'],
  ['Tablet review', '768px+', '디자인 시스템 문서와 관리자성 화면의 중간 폭 검토 기준입니다.'],
  ['Desktop review', '1024px+', '디자인 시스템 페이지가 사이드바와 본문 2열로 전환되는 기준입니다.'],
  ['Wide desktop', '1280px+', '본문 카드 그리드가 여러 열로 확장되는 넓은 화면 검토 기준입니다.'],
]

const radiusTokens = [
  ['--r-xs', '8px', '스켈레톤, 작은 배지'],
  ['--r-sm', '10px', '버튼, 입력창, 투표 옵션'],
  ['--r-md', '12px', '카드, 결과 패널, 목록 그룹'],
  ['--r-lg', '16px', '바텀 시트, 큰 모달 상단'],
  ['--r-pill', '9999px', '칩, 아바타, 점 인디케이터'],
]

const shadowTokens = [
  ['shadow-w100', '헤더, 소형 컴포넌트', 'var(--sh-w100)'],
  ['shadow-w200', 'contained 버튼', 'var(--sh-w200)'],
  ['shadow-w300', '바텀 시트, 대형 카드', 'var(--sh-w300)'],
  ['shadow-g100', '회색 배경 위 소형 표면', 'var(--sh-g100)'],
  ['shadow-g200', '투표 카드, 결과 카드, 프로필 카드', 'var(--sh-g200)'],
  ['shadow-g300', '회색 배경 위 대형 시트', 'var(--sh-g300)'],
]

const spacingTokens = [
  ['space-2', '2px', '미세한 보정, hairline 인접 간격'],
  ['space-4', '4px', '아이콘과 짧은 라벨 사이'],
  ['space-6', '6px', '칩 내부/작은 그룹 간격'],
  ['space-8', '8px', '버튼 그룹, 작은 카드 내부'],
  ['space-10', '10px', '조밀한 리스트 내부 간격'],
  ['space-12', '12px', '기본 컴포넌트 gap'],
  ['space-16', '16px', '페이지 기본 좌우 padding, 카드 padding'],
  ['space-20', '20px', '섹션 내부 padding'],
  ['space-24', '24px', '섹션 간 기본 간격'],
  ['space-32', '32px', '큰 섹션 간격'],
  ['space-40', '40px', '화면 블록 간 넓은 간격'],
  ['space-48', '48px', '상단/하단 주요 여백'],
]

function NavGroup({
  title,
  items,
}: {
  title: string
  items: string[][]
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-bold uppercase leading-none text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {items.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="block rounded-xs px-3 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  description,
  source,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  source?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 border-b border-border px-5 py-8 sm:px-8">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase leading-none text-primary">{eyebrow}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[18px] font-black leading-tight text-foreground">{title}</h2>
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          {source && (
            <code className="max-w-full overflow-x-auto rounded-xs border border-border bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
              {source}
            </code>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function PreviewGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
      {children}
    </div>
  )
}

function PreviewPanel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-white p-4 shadow-sm">
      <p className="text-[14px] font-black leading-tight text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function PollOptionSample({
  selected = false,
  disabled = false,
  withImage = false,
}: {
  selected?: boolean
  disabled?: boolean
  withImage?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-sm border bg-white px-4 py-3.5',
        selected && 'border-primary bg-primary/10',
        disabled && 'border-border bg-secondary opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border',
          selected && 'border-primary'
        )}
      >
        {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
      {withImage && (
        <div className="h-10 w-10 shrink-0 rounded-xs bg-[#0c2340] text-center text-[12px] font-black leading-10 text-primary">
          9
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight text-foreground">재계약</p>
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
          선수의 현재 폼과 스쿼드 밸런스를 고려한 선택지
        </p>
      </div>
    </div>
  )
}

function PollCarouselCardSample({
  type,
  selected = false,
  side = false,
  missingImage = false,
  longText = false,
}: {
  type: 'player' | 'free'
  selected?: boolean
  side?: boolean
  missingImage?: boolean
  longText?: boolean
}) {
  const isFree = type === 'free'
  const imageUrl = isFree
    ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1598880513655-d6d6d8b3f7a1?auto=format&fit=crop&w=600&q=80'
  const title = isFree
    ? longText
      ? '경기 마지막 10분 동안 보여준 압박 유지와 빠른 측면 전환'
      : '후반 교체 타이밍'
    : longText
      ? 'Sandro Tonali Long Display Name'
      : 'Alexander Isak'

  return (
    <div
      className={cn(
        'w-[200px] overflow-hidden rounded-md border border-border bg-surface text-left shadow-g200 transition-all',
        selected && 'border-primary shadow-w200 ring-[3px] ring-inset ring-primary',
        side && 'scale-[.88] opacity-55'
      )}
    >
      <div
        className="relative aspect-square w-full overflow-hidden bg-[#0c2340]"
        style={missingImage ? undefined : { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {missingImage && (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-[#0c2340] text-[38px] font-black text-white">
            {isFree ? '투표' : 'AI'}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
        {!isFree && (
          <span className="absolute left-2.5 top-2.5 rounded-pill bg-white/95 px-2.5 py-1 text-[12px] font-black leading-none text-foreground shadow-g100">
            #14
          </span>
        )}
        {selected && (
          <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-w200">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className={cn('bg-surface px-3 py-2.5', isFree ? 'min-h-[92px]' : 'min-h-[62px]')}>
        <p className={cn('text-[15px] font-black leading-tight text-foreground', isFree ? 'line-clamp-2' : 'line-clamp-1')}>
          {title}
        </p>
        {isFree ? (
          <p className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-snug text-muted-foreground">
            경기 흐름을 바꾼 선택이라 가장 인상적이었습니다.
          </p>
        ) : (
          <p className="mt-0.5 text-[12px] font-bold leading-tight text-muted-foreground">
            FWD
          </p>
        )}
      </div>
    </div>
  )
}

function ResultBar({
  label,
  percent,
  selected,
}: {
  label: string
  percent: number
  selected?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {selected && (
            <Badge className="border-0 bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/10">
              내 선택
            </Badge>
          )}
          <span className="truncate text-[13px] font-bold text-foreground">{label}</span>
        </div>
        <span className="text-[13px] font-black tabular-nums text-foreground">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full', selected ? 'bg-primary' : 'bg-border')}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'primary' | 'positive' | 'negative' | 'neutral'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none',
        tone === 'primary' && 'bg-primary-dim text-primary-dark',
        tone === 'positive' && 'bg-positive-dim text-positive',
        tone === 'negative' && 'bg-negative-dim text-negative',
        tone === 'neutral' && 'bg-disabled text-gray-2'
      )}
    >
      {children}
    </span>
  )
}

export default function DevDesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-background text-foreground">
      <div className="flex min-h-screen w-full flex-col lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="space-y-7 p-5">
            <div>
              <p className="text-[11px] font-bold uppercase leading-none text-primary">
                Development only
              </p>
              <h1 className="mt-2 text-[20px] font-black leading-tight text-foreground">
                Design System
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                NUFCVOTE 컴포넌트를 실제 코드 기준으로 확인합니다.
              </p>
            </div>
            <NavGroup title="Foundation" items={foundationItems} />
            <NavGroup title="Core UI" items={coreItems} />
            <NavGroup title="Service UI" items={serviceItems} />
          </div>
        </aside>

        <div className="min-w-0 bg-background">
          <Section
            id="overview"
            eyebrow="Foundation"
            title="개요"
            description="실제로 렌더링되는 앱을 디자인 시스템의 기준으로 삼습니다. Figma는 탐색용으로 활용하되, 1차 버전의 결정은 토큰, 컴포넌트, 이 개발 전용 미리보기 페이지에 둡니다."
          >
            <PreviewGrid>
              <PreviewPanel title="코드베이스 우선" description="가능한 경우 실제 앱 스타일과 기존 UI 컴포넌트를 그대로 사용합니다.">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  디자인 수정이 패턴으로 굳기 전에 이 페이지에서 실제 렌더링 상태를 확인합니다.
                </p>
              </PreviewPanel>
              <PreviewPanel title="Figma는 보조 도구" description="무료 범위의 Figma 사용은 선택 사항이며 코드보다 우선하지 않습니다.">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  Dev Mode, MCP, Code Connect는 1차 범위의 필수 조건이 아닙니다.
                </p>
              </PreviewPanel>
              <PreviewPanel title="1차 범위" description="Foundation, Core UI, Service UI까지만 먼저 정리합니다.">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  전체 페이지 레이아웃 패턴은 컴포넌트 일관성이 잡힌 뒤로 미룹니다.
                </p>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="colors"
            eyebrow="Foundation"
            title="색상"
            description="색상은 역할별로 나누어 관리합니다. 배경/라인, 라벨, 브랜드 primary, 상태 색상을 분리해 임의 색상 사용을 줄입니다."
            source="src/app/globals.css"
          >
            <div className="space-y-5">
              {colorGroups.map(group => (
                <div key={group.title} className="rounded-xs border border-border bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-[16px] font-bold leading-tight text-foreground">{group.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
                    {group.colors.map(([name, value, token, usage]) => (
                      <div key={name} className="rounded-xs border border-border bg-white p-3">
                        <div
                          className="h-14 rounded-[4px] border border-border"
                          style={{ background: value }}
                        />
                        <p className="mt-3 text-[13px] font-black leading-tight text-foreground">{name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{token}</p>
                        <p className="mt-2 text-[12px] leading-snug text-muted-foreground">{usage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="typography"
            eyebrow="Foundation"
            title="타이포그래피"
            description="첨부한 스케일을 기준으로 display부터 label까지 정리합니다. 긴 본문은 16px / 1.5를 기본으로 사용합니다."
            source="docs/specs/11-design-system.md"
          >
            <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
              {typeScale.map(([name, fontSize, fontWeight, lineHeight, sample], index) => (
                <div
                  key={name}
                  className={cn('grid gap-4 px-4 py-5 lg:grid-cols-[140px_180px_1fr]', index > 0 && 'border-t border-border')}
                >
                  <div>
                    <p className="text-[13px] font-black text-foreground">{name}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">token</p>
                  </div>
                  <p className="text-[12px] font-semibold text-muted-foreground">
                    {fontSize} · {fontWeight} · {lineHeight}
                  </p>
                  <p
                    className="text-foreground"
                    style={{
                      fontSize,
                      fontWeight,
                      lineHeight,
                      textTransform: name === 'text-xxs' ? 'uppercase' : 'none',
                    }}
                  >
                    {sample}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="layout-breakpoints"
            eyebrow="Foundation"
            title="Layout & Breakpoints"
            description="서비스 화면은 모바일 앱 쉘을 기준으로 하고, 디자인 시스템 같은 개발 도구는 데스크톱 전체 폭을 활용합니다."
          >
            <PreviewGrid>
              {layoutBreakpoints.map(([name, value, usage]) => (
                <PreviewPanel key={name} title={name} description={usage}>
                  <div className="rounded-xs border border-border bg-secondary px-3 py-2 text-[13px] font-bold text-foreground">
                    {value}
                  </div>
                </PreviewPanel>
              ))}
            </PreviewGrid>
          </Section>

          <Section
            id="radius-tokens"
            eyebrow="Foundation"
            title="Radius & Shadow"
            description="Radius는 LDSG 스케일을 따르고, shadow는 배경이 흰색인지 회색인지에 따라 분리해 사용합니다."
          >
            <div className="space-y-4">
              <PreviewGrid>
                {radiusTokens.map(([name, value, usage]) => (
                  <PreviewPanel key={name} title={name} description={`${value} · ${usage}`}>
                    <div
                      className="h-16 border border-border bg-white shadow-g100"
                      style={{ borderRadius: value }}
                    />
                  </PreviewPanel>
                ))}
              </PreviewGrid>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
                {shadowTokens.map(([name, usage, value]) => (
                  <div key={name} className="rounded-md border border-border bg-white p-4" style={{ boxShadow: value }}>
                    <p className="text-[13px] font-black text-foreground">{name}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{usage}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section
            id="spacing-tokens"
            eyebrow="Foundation"
            title="Spacing Tokens"
            description="간격과 radius는 짝수 px 스케일을 사용합니다. radius는 8, 10, 12, 16px을 기준으로 새 패턴을 만듭니다."
          >
            <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
              {spacingTokens.map(([name, value, usage], index) => (
                <div
                  key={name}
                  className={cn('grid gap-4 px-4 py-3 lg:grid-cols-[120px_100px_1fr_180px]', index > 0 && 'border-t border-border')}
                >
                  <p className="text-[13px] font-black text-foreground">{name}</p>
                  <p className="text-[12px] font-semibold text-muted-foreground">{value}</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{usage}</p>
                  <div className="flex items-center">
                    <div className="h-4 rounded-full bg-primary" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="states"
            eyebrow="Foundation"
            title="상호작용 상태"
            description="새 상태 색상을 만들기보다 opacity와 기존 토큰을 우선 사용합니다."
          >
            <PreviewGrid>
              <PreviewPanel title="기본">
                <Button className="w-full">투표하기</Button>
              </PreviewPanel>
              <PreviewPanel title="호버">
                <Button className="w-full opacity-70">투표하기</Button>
              </PreviewPanel>
              <PreviewPanel title="눌림">
                <Button className="w-full opacity-50">투표하기</Button>
              </PreviewPanel>
              <PreviewPanel title="비활성">
                <Button className="w-full" disabled>투표 종료</Button>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="button"
            eyebrow="Core UI"
            title="버튼"
            description="주요 액션은 contained 버튼을 사용합니다. 보조 액션은 outlined 또는 ghost 버튼을 사용합니다."
            source="src/components/ui/button.tsx"
          >
            <PreviewGrid>
              <PreviewPanel title="종류">
                <div className="flex flex-wrap gap-2">
                  <Button>주요 액션</Button>
                  <Button variant="outline">보조 액션</Button>
                  <Button variant="ghost">고스트</Button>
                  <Button variant="destructive">위험 액션</Button>
                </div>
              </PreviewPanel>
              <PreviewPanel title="크기">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">작게</Button>
                  <Button>기본</Button>
                  <Button size="lg">크게</Button>
                  <Button size="icon" aria-label="send">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </PreviewPanel>
              <PreviewPanel title="로딩과 비활성">
                <div className="flex flex-wrap gap-2">
                  <Button disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    제출 중
                  </Button>
                  <Button variant="outline" disabled>취소</Button>
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="chip-badge"
            eyebrow="Core UI"
            title="칩 / 뱃지"
            description="작은 메타 정보는 pill 형태의 뱃지와 조밀한 텍스트로 표현합니다."
            source="src/components/ui/badge.tsx"
          >
            <PreviewPanel title="서비스 뱃지 톤">
              <div className="flex flex-wrap gap-2">
                <Badge>평가</Badge>
                <Badge variant="secondary">선택</Badge>
                <Badge variant="outline">종료</Badge>
                <StatusPill tone="primary">내 선택</StatusPill>
                <StatusPill tone="positive">투표 완료</StatusPill>
                <StatusPill tone="negative">D-1</StatusPill>
                <StatusPill>보류</StatusPill>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="card"
            eyebrow="Core UI"
            title="카드"
            description="카드는 회색 앱 배경 위에 놓이며, 과하게 커지지 않도록 유지합니다."
            source="src/components/ui/card.tsx"
          >
            <PreviewGrid>
              <Card className="rounded-md">
                <CardHeader>
                  <CardTitle className="text-[16px]">기본 카드</CardTitle>
                  <CardDescription>반복 콘텐츠를 묶는 기본 표면</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">
                    내용은 짧고 스캔하기 쉬워야 합니다.
                  </p>
                </CardContent>
              </Card>
              <PreviewPanel title="빈 상태 카드">
                <div className="rounded-md border border-dashed border-border bg-secondary px-4 py-8 text-center">
                  <p className="text-[13px] font-semibold text-muted-foreground">표시할 항목이 없습니다</p>
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="input"
            eyebrow="Core UI"
            title="입력"
            description="입력 요소는 작은 radius, 명확한 테두리, primary focus 상태를 사용합니다."
          >
            <PreviewGrid>
              <PreviewPanel title="텍스트 입력">
                <input
                  className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary"
                  placeholder="투표 제목"
                />
              </PreviewPanel>
              <PreviewPanel title="비활성">
                <input
                  className="w-full rounded-sm border border-border bg-secondary px-3 py-2.5 text-[14px] text-muted-foreground outline-none"
                  placeholder="수정할 수 없음"
                  disabled
                />
              </PreviewPanel>
              <PreviewPanel title="댓글 입력">
                <textarea
                  className="min-h-20 w-full resize-none rounded-sm border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed outline-none focus:border-primary"
                  placeholder="이번 투표에 대한 생각을 남겨주세요"
                />
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="progress"
            eyebrow="Core UI"
            title="프로그레스"
            description="결과 분포와 진행률은 pill 형태의 얇은 바를 사용합니다."
            source="src/components/ui/progress.tsx"
          >
            <PreviewGrid>
              <PreviewPanel title="투표 결과 바">
                <div className="space-y-4">
                  <ResultBar label="재계약" percent={52} selected />
                  <ResultBar label="보류" percent={31} />
                  <ResultBar label="방출" percent={17} />
                </div>
              </PreviewPanel>
              <PreviewPanel title="단일 진행률">
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-pill bg-disabled">
                    <div className="h-full w-[68%] rounded-pill bg-primary" />
                  </div>
                  <p className="text-[12px] font-semibold text-muted-foreground">68% 완료</p>
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="separator"
            eyebrow="Core UI"
            title="구분선"
            description="목록과 섹션 구분은 1px 이하의 낮은 대비 선을 사용합니다."
            source="src/components/ui/separator.tsx"
          >
            <PreviewPanel title="섹션 구분">
              <div className="space-y-4">
                <div>
                  <p className="text-[14px] font-black text-foreground">댓글</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">콘텐츠 그룹 상단</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-[14px] font-black text-foreground">관련 투표</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">다음 콘텐츠 그룹</p>
                </div>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="sheet-modal"
            eyebrow="Core UI"
            title="시트 / 모달"
            description="바텀 시트는 상단 모서리에만 radius를 주고, 짧은 핸들을 함께 사용합니다."
            source="src/components/ui/sheet.tsx"
          >
            <PreviewPanel title="바텀 시트 구조">
              <div className="mx-auto max-w-sm rounded-t-md border border-border bg-white p-5 shadow-lg">
                <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-border" />
                <p className="text-[16px] font-black text-foreground">이 선택으로 투표하시겠어요?</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  제출 후에는 변경할 수 없습니다.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button className="flex-1" variant="outline">취소</Button>
                  <Button className="flex-[2]">최종 제출</Button>
                </div>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="list-group"
            eyebrow="Core UI"
            title="목록 그룹"
            description="목록 그룹은 흰색 표면, 작은 radius, 은은한 구분선을 사용합니다."
          >
            <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
              {['내가 만든 투표', '참여한 투표', '댓글 단 투표'].map((label, index) => (
                <div key={label} className={cn('flex items-center justify-between px-4 py-4', index > 0 && 'border-t border-border')}>
                  <div>
                    <p className="text-[14px] font-black text-foreground">{label}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">최근 활동을 확인합니다</p>
                  </div>
                  <StatusPill>{index + 1}개</StatusPill>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="avatar"
            eyebrow="Core UI"
            title="아바타"
            description="아바타는 원형을 유지하고, 이미지가 없을 때 읽기 쉬운 fallback을 제공합니다."
            source="src/components/ui/avatar.tsx"
          >
            <PreviewPanel title="Fallback 크기">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-[12px] font-black text-white">K</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-secondary text-[13px] font-black">NU</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[#0c2340] text-[14px] font-black text-primary">9</AvatarFallback>
                </Avatar>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="navigation"
            eyebrow="Core UI"
            title="내비게이션"
            description="앱 헤더와 하단 탭은 흰색 표면, 얇은 구분선, primary 활성 상태를 공유합니다."
            source="src/components/layout"
          >
            <PreviewGrid>
              <PreviewPanel title="앱 헤더">
                <div className="border-b border-border bg-white px-4 py-3 shadow-w100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-pill bg-primary" />
                      <span className="text-[15px] font-black text-foreground">NUFCVOTE</span>
                    </div>
                    <StatusPill tone="primary">로그인</StatusPill>
                  </div>
                </div>
              </PreviewPanel>
              <PreviewPanel title="하단 탭">
                <div className="border-t border-border bg-white px-4 pb-3 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['홈', Home, true],
                      ['투표', Vote, false],
                      ['구단 정보', Shield, false],
                    ].map(([label, Icon, active]) => {
                      const NavIcon = Icon as typeof Home
                      return (
                        <div key={label as string} className={cn('flex flex-col items-center gap-0.5 text-[10px] font-semibold', active ? 'text-primary' : 'text-muted-foreground')}>
                          <NavIcon className="h-5 w-5" />
                          <span>{label as string}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="poll-card"
            eyebrow="Service UI"
            title="투표 카드"
            description="투표 카드는 상태, 제목, 작성자, 썸네일, 참여 정보를 요약합니다."
            source="src/components/polls/PollCard.tsx"
          >
            <PreviewGrid>
              {[
                ['진행 중', '이번 시즌 가장 인상적인 영입은?', '1,240명 참여'],
                ['예정', '다음 주 공개 예정 투표', '공개 전'],
                ['종료', '이달의 선수 투표 결과', '결과 열람 가능'],
              ].map(([status, title, meta]) => (
                <div key={status} className={cn('rounded-md border border-border bg-white p-4 shadow-sm', status === '종료' && 'opacity-70')}>
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#0c2340] text-[18px] font-black text-primary', status === '예정' && 'blur-[1px]')}>
                      NU
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <StatusPill tone={status === '진행 중' ? 'primary' : 'neutral'}>{status}</StatusPill>
                        {status === '예정' && <StatusPill><Lock className="mr-1 h-3 w-3" />공개 전</StatusPill>}
                      </div>
                      <p className="truncate text-[15px] font-black leading-tight text-foreground">{title}</p>
                      <p className="mt-2 text-[12px] font-semibold text-muted-foreground">{meta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </PreviewGrid>
          </Section>

          <Section
            id="poll-carousel-card"
            eyebrow="Service UI"
            title="투표 캐러셀 카드"
            description="투표 상세에서 카드를 넘겨 하나를 선택하는 패턴입니다. 이미지는 1:1이고, 텍스트는 이미지 위가 아니라 하단 정보 패널에 고정합니다."
            source="src/components/polls/TypeBPollClient.tsx"
          >
            <PreviewGrid>
              <PreviewPanel title="선수 · 기본" description="선수 카드는 이름과 포지션만 표시합니다. 등번호는 이미지 칩에서만 1회 노출합니다.">
                <PollCarouselCardSample type="player" />
              </PreviewPanel>
              <PreviewPanel title="선수 · 선택됨">
                <PollCarouselCardSample type="player" selected />
              </PreviewPanel>
              <PreviewPanel title="선수 · 사이드">
                <PollCarouselCardSample type="player" side />
              </PreviewPanel>
              <PreviewPanel title="선수 · 이미지 없음">
                <PollCarouselCardSample type="player" missingImage />
              </PreviewPanel>
              <PreviewPanel title="자유 입력 · 기본" description="카드 내부에 유형 라벨을 넣지 않고 사용자가 입력한 제목과 설명만 표시합니다.">
                <PollCarouselCardSample type="free" />
              </PreviewPanel>
              <PreviewPanel title="자유 입력 · 선택됨">
                <PollCarouselCardSample type="free" selected />
              </PreviewPanel>
              <PreviewPanel title="자유 입력 · 사이드">
                <PollCarouselCardSample type="free" side />
              </PreviewPanel>
              <PreviewPanel title="자유 입력 · 긴 텍스트">
                <PollCarouselCardSample type="free" longText />
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="poll-option"
            eyebrow="Service UI"
            title="투표 옵션"
            description="투표 옵션은 선택 상태를 명확히 보여주되, 관련 없는 색상은 바꾸지 않습니다."
          >
            <PreviewGrid>
              <PreviewPanel title="미선택">
                <PollOptionSample />
              </PreviewPanel>
              <PreviewPanel title="선택됨">
                <PollOptionSample selected />
              </PreviewPanel>
              <PreviewPanel title="이미지 포함">
                <PollOptionSample selected withImage />
              </PreviewPanel>
              <PreviewPanel title="비활성">
                <PollOptionSample disabled />
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="result-view"
            eyebrow="Service UI"
            title="결과 화면"
            description="결과 화면은 최다 득표 항목을 강조하고, 모든 비율을 빠르게 읽을 수 있게 유지합니다."
          >
            <PreviewGrid>
              <PreviewPanel title="최다 득표 카드">
                <div className="rounded-md bg-primary p-5 text-white">
                  <p className="text-[11px] font-bold uppercase opacity-75">최다 득표</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-[20px] font-black leading-tight">알렉산더 이삭</p>
                    <p className="text-[34px] font-black leading-none">48%</p>
                  </div>
                </div>
              </PreviewPanel>
              <PreviewPanel title="분포 바">
                <div className="space-y-4">
                  <ResultBar label="알렉산더 이삭" percent={48} selected />
                  <ResultBar label="브루노 기마랑이스" percent={34} />
                  <ResultBar label="산드로 토날리" percent={18} />
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>

          <Section
            id="comment-item"
            eyebrow="Service UI"
            title="댓글 아이템"
            description="댓글은 작성자, 선택 항목 뱃지, 본문, 가벼운 액션을 함께 보여줍니다."
          >
            <PreviewPanel title="댓글 상태">
              <div className="space-y-5">
                {['일반 댓글', '내 댓글'].map((label, index) => (
                  <div key={label} className="flex gap-3">
                    <Avatar className="mt-0.5 h-8 w-8">
                      <AvatarFallback className="bg-secondary text-[12px] font-black">
                        {index === 0 ? 'S' : 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[12px] font-bold text-foreground">{label}</p>
                        {index === 1 && <StatusPill tone="primary">재계약</StatusPill>}
                        <span className="text-[11px] text-muted-foreground">방금 전</span>
                      </div>
                      <p className="mt-1 text-[14px] leading-relaxed text-foreground">
                        선수의 최근 경기력을 보면 다음 시즌에도 핵심 역할을 맡길 만합니다.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="player-summary"
            eyebrow="Service UI"
            title="선수 요약"
            description="선수 요약은 사진, 이름, 상태, 시즌 스탯을 하나의 조밀한 블록에 담습니다."
          >
            <PreviewPanel title="선수 요약">
              <div className="flex items-center gap-4 rounded-md border border-border bg-white p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[#0c2340] text-[20px] font-black text-primary">
                  39
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-black text-foreground">Bruno Guimaraes</p>
                    <StatusPill tone="positive">1군</StatusPill>
                  </div>
                  <p className="mt-1 text-[12px] font-semibold text-muted-foreground">MF · 34경기 · 5골 · 7도움</p>
                </div>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="status-badge"
            eyebrow="Service UI"
            title="상태 뱃지"
            description="상태 뱃지는 도메인 상태를 작고 예측 가능한 시각 톤으로 매핑합니다."
          >
            <PreviewPanel title="도메인 상태">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="primary"><Clock className="mr-1 h-3 w-3" />진행 중</StatusPill>
                <StatusPill><Lock className="mr-1 h-3 w-3" />예정</StatusPill>
                <StatusPill>종료</StatusPill>
                <StatusPill tone="positive"><Check className="mr-1 h-3 w-3" />투표 완료</StatusPill>
                <StatusPill tone="negative">마감 임박</StatusPill>
                <StatusPill tone="primary"><Trophy className="mr-1 h-3 w-3" />최다 득표</StatusPill>
                <StatusPill><User className="mr-1 h-3 w-3" />유저 생성</StatusPill>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="farewell-card"
            eyebrow="Service UI"
            title="작별 / 이적 카드"
            description="영입과 이탈 카드에는 방향성, 대상 선수, 클럽 정보를 조밀하게 담습니다."
            source="src/components/farewells/FarewellCard.tsx"
          >
            <PreviewGrid>
              {[
                ['영입', 'positive', 'Anthony Gordon', 'from Everton'],
                ['이적', 'primary', 'Miguel Almiron', 'to Atlanta United'],
              ].map(([tag, tone, name, club]) => (
                <div key={name} className="rounded-md border border-border bg-white p-3 shadow-g200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-dim text-[14px] font-black text-primary-dark">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        <StatusPill tone={tone as 'positive' | 'primary'}>{tag}</StatusPill>
                        <span className="truncate text-[11px] font-semibold text-muted-foreground">{club}</span>
                      </div>
                      <p className="truncate text-[14px] font-bold leading-snug text-foreground">{name}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">2021 - 2026</p>
                    </div>
                  </div>
                </div>
              ))}
            </PreviewGrid>
          </Section>

          <Section
            id="transfer-item"
            eyebrow="Service UI"
            title="이적 아이템"
            description="이적 탭의 선수 아이템은 카드형 그리드 안에서 방향 라벨, 사진, 클럽명을 보여줍니다."
            source="src/components/transfers/TransferListItem.tsx"
          >
            <PreviewGrid>
              {[
                ['IN', 'Yoane Wissa', 'from Brentford'],
                ['OUT', 'Callum Wilson', 'to West Ham'],
                ['LOAN', 'Lewis Miley', 'to loan club'],
              ].map(([direction, name, club]) => (
                <article key={name} className="relative flex min-h-[160px] flex-col items-center justify-center rounded-md border border-border bg-white px-4 py-5 text-center shadow-g200">
                  <span className="absolute left-4 top-4 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                    {direction}
                  </span>
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-pill bg-disabled text-[14px] font-black text-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-3 text-[15px] font-black text-foreground">{name}</p>
                  <p className="mt-1 max-w-full truncate text-[12px] font-semibold text-muted-foreground">{club}</p>
                </article>
              ))}
            </PreviewGrid>
          </Section>

          <Section
            id="club-status"
            eyebrow="Service UI"
            title="구단 현황 카드"
            description="브랜드가 강하게 드러나는 대시보드형 카드는 어두운 클럽 컬러 위에 primary와 흰색 텍스트를 사용합니다."
            source="src/components/club/ClubStatusCard.tsx"
          >
            <PreviewPanel title="구단 현황">
              <div className="overflow-hidden rounded-lg bg-[#0c2340] p-4 text-white shadow-g200">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-pill bg-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-primary">구단 현황 · 2025-26 시즌</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/10 px-3 py-2.5">
                    <p className="text-[10px] text-white/55">리그 순위</p>
                    <p className="mt-0.5 text-[28px] font-black leading-none">5<span className="text-[16px] font-bold">위</span></p>
                    <p className="mt-1 text-[10px] font-semibold text-primary">PL</p>
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-2.5">
                    <p className="text-[10px] text-white/55">다음 경기</p>
                    <p className="mt-1 text-[15px] font-extrabold">vs Arsenal</p>
                    <p className="mt-1 text-[11px] text-white/70">6월 7일 · 홈</p>
                  </div>
                </div>
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="squad-list"
            eyebrow="Service UI"
            title="스쿼드 목록"
            description="스쿼드 목록은 segmented tab, 포지션 헤더, 선수 행으로 구성됩니다."
            source="src/components/club/SquadList.tsx"
          >
            <PreviewPanel title="선수 목록">
              <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-lg bg-disabled p-1">
                {['1군 25', '임대 7', 'U21 12'].map((tab, index) => (
                  <div key={tab} className={cn('h-9 rounded-sm text-center text-[12px] font-bold leading-9', index === 0 ? 'bg-white text-primary shadow-g100' : 'text-muted-foreground')}>
                    {tab}
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-md border border-border bg-white shadow-g200">
                <div className="border-b border-border px-3.5 py-2">
                  <span className="text-[11px] font-extrabold tracking-widest text-primary">MID</span>
                </div>
                {['Bruno Guimaraes', 'Sandro Tonali', 'Joelinton'].map((name, index) => (
                  <div key={name} className={cn('flex items-center gap-2.5 px-3.5 py-2.5', index > 0 && 'border-t border-disabled')}>
                    <span className="w-7 text-center text-[15px] font-black text-muted-foreground">{index + 7}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-dim text-[12px] font-black text-primary-dark">{name.slice(0, 1)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-foreground">{name}</p>
                      <p className="text-[11px] text-muted-foreground">Brazil</p>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="rating-matrix"
            eyebrow="Service UI"
            title="평점 매트릭스"
            description="전체 평가 투표는 선수 행과 1-10점 선택 칩을 반복하는 조밀한 입력 패턴입니다."
            source="src/components/polls/OverallRatingPollClient.tsx"
          >
            <PreviewPanel title="선수 평점">
              <div className="space-y-3">
                {['Nick Pope', 'Kieran Trippier'].map((name, rowIndex) => (
                  <div key={name} className="rounded-md border border-border bg-white p-3 shadow-g100">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-disabled text-[12px] font-black text-primary">{name.slice(0, 2).toUpperCase()}</div>
                      <p className="text-[14px] font-black text-foreground">{name}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[6, 7, 8, 9, 10].map(score => (
                        <div key={score} className={cn('rounded-sm border py-2 text-center text-[12px] font-black', score === 8 + rowIndex ? 'border-primary bg-primary-dim text-primary-dark' : 'border-border text-muted-foreground')}>
                          <Star className="mx-auto mb-1 h-3 w-3" />
                          {score}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PreviewPanel>
          </Section>

          <Section
            id="form-section"
            eyebrow="Service UI"
            title="폼 섹션"
            description="투표 생성과 관리자 입력 폼은 흰색 섹션, 작은 입력, dashed picker, 하단 CTA를 반복합니다."
            source="src/components/polls/UserPollCreateForm.tsx"
          >
            <PreviewGrid>
              <PreviewPanel title="투표 생성 섹션">
                <div className="space-y-2.5 rounded-md border border-border bg-white p-4 shadow-g200">
                  <p className="text-[14px] font-black text-foreground">투표 정보</p>
                  <input className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary" placeholder="투표 제목" />
                  <button type="button" className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-border px-3 py-3 text-[12px] font-semibold text-muted-foreground">
                    <Search className="h-4 w-4" />
                    선수 선택
                  </button>
                </div>
              </PreviewPanel>
              <PreviewPanel title="댓글 작성기">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <textarea className="min-h-16 flex-1 resize-none rounded-sm border border-border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary" placeholder="의견을 남겨주세요" />
                    <Button size="icon" aria-label="comment send">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" />
                    댓글 액션은 작은 아이콘 버튼으로 유지합니다.
                  </div>
                </div>
              </PreviewPanel>
            </PreviewGrid>
          </Section>
        </div>
      </div>
    </main>
  )
}
