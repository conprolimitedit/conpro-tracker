import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        // Logout is handled on the client side by clearing tokens
        // This endpoint can be used for server-side logout if needed
        return NextResponse.json({ 
            message: 'Logout successful' 
        }, { status: 200 })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }
}
