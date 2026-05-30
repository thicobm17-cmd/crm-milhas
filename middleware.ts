import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/cadastro') ||
    req.nextUrl.pathname.startsWith('/questionario')

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|questionario|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
