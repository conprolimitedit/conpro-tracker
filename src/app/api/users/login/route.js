import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'
import jwt from 'jsonwebtoken'

export async function POST(request) {
    const { email, password } = await request.json()
    console.log("Login attempt for email:", email)
    
    try {
        // Query your custom users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password) // Note: In production, you should hash passwords
            .maybeSingle()

            console.log("Data:", data)

        if (error) {
            console.error('Login error:', error)
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Create JWT token with user ID
        const token = jwt.sign(
            { userId: data.id, email: data.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        )

        // Return user data (excluding password for security) and token
        const { password: _, ...userWithoutPassword } = data
        
        return NextResponse.json({ 
            message: 'Login successful', 
            user: userWithoutPassword,
            token: token
        }, { status: 200 })
        
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
