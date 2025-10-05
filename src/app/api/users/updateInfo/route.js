import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'
import jwt from 'jsonwebtoken'

export async function PUT(request) {
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

        // Get update data from request body
        const updateData = await request.json()
        
        // Remove sensitive fields that shouldn't be updated
        const { id, password, ...allowedUpdates } = updateData

        // Update user in database
        const { data, error } = await supabase
            .from('users')
            .update(allowedUpdates)
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Update error:', error)
            return NextResponse.json({ error: 'Failed to update user' }, { status: 400 })
        }

        // Return updated user data (excluding password)
        const { password: _, ...userWithoutPassword } = data
        
        return NextResponse.json({ 
            message: 'User updated successfully',
            user: userWithoutPassword 
        }, { status: 200 })
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        }
        
        console.error('Update user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
