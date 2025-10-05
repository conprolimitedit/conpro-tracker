import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request) {
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/projects', '/contentManagement', '/users']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Skip middleware for non-protected routes
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check for token in localStorage (client-side only)
  if (typeof window === 'undefined') {
    return NextResponse.next()
  }

  const token = localStorage.getItem('token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    return NextResponse.next()
  } catch (error) {
    // Token is invalid, redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/contentManagement/:path*',
    '/users/:path*'
  ]
}
