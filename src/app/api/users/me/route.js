import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'
import jwt from 'jsonwebtoken'

export async function GET(request) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        const { userId } = decoded

        // Fetch user from database
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = data
        
        return NextResponse.json({ 
            user: userWithoutPassword 
        }, { status: 200 })
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        }
        
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
