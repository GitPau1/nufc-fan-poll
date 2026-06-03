import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin'

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const IS_MOCK = !_url || !_url.startsWith('http')

export async function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    request.nextUrl.pathname.startsWith('/dev/design-system')
  ) {
    return new NextResponse(null, { status: 404 })
  }

  if (IS_MOCK) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 로그인 필수 경로 → 미로그인 시 /login으로 리다이렉트
  if (!user && (pathname.startsWith('/my') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /admin → 관리자만 허용
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!isAdmin(user.email)) return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Supabase SSR: 세션 갱신을 위해 모든 경로에서 실행.
     * 정적 파일·이미지·파비콘 제외.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
