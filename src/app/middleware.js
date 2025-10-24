import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Public routes (allow unauthenticated access)
  const publicRoutes = ['/', '/login']
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
  if (isPublic) return NextResponse.next()

  // Protected routes
  const protectedPrefixes = ['/projects', '/contentManagement', '/users']
  const isProtected = protectedPrefixes.some(route => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Read JWT from HttpOnly cookie (set by login route)
  const tokenCookie = request.cookies.get('auth_token')
  const token = tokenCookie?.value
  if (!token) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  try {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key'
    const payload = jwt.verify(token, secret)

    // Admin-only guard for /users
    if (pathname.startsWith('/users') && payload?.userRole !== 'admin') {
      const url = new URL('/', request.url)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (err) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/projects/:path*', '/contentManagement/:path*', '/users/:path*']
}
