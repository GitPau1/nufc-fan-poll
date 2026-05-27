import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const IS_MOCK = !_url || !_url.startsWith('http')

export async function middleware(request: NextRequest) {
  // 목 모드: 모든 경로 허용 (데모 프로필 표시)
  if (IS_MOCK) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /my 는 로그인 필수 → 미로그인 시 / 로 리다이렉트
  if (!user && request.nextUrl.pathname.startsWith('/my')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/my/:path*'],
}
