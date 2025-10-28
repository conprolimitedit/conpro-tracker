import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const res = NextResponse.json({ 
            success: true,
            message: 'Logout successful' 
        }, { status: 200 })
        
        // Clear auth cookie with same settings as login (secure, sameSite, httpOnly)
        // Important: These settings must match the login cookie settings exactly
        res.cookies.set('auth_token', '', { 
            httpOnly: true, 
            secure: true,
            sameSite: 'lax',
            path: '/', 
            maxAge: 0 // Expire immediately
        })
        
        console.log('✅ Server-side logout: auth_token cookie cleared')
        
        return res
    } catch (error) {
        console.error('❌ Logout error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Logout failed' 
        }, { status: 500 })
    }
}
