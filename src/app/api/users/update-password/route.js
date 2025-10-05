import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'
import { hashPassword, verifyPassword, isPasswordHashed } from '@/app/lib/passwordUtils'

export async function PUT(request) {
    const { userId, currentPassword, newPassword } = await request.json()
    
    try {
        // Get current user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify current password
        let isValidCurrentPassword = false
        
        if (isPasswordHashed(user.password)) {
            // Password is hashed, use bcrypt to verify
            isValidCurrentPassword = await verifyPassword(currentPassword, user.password)
        } else {
            // Password is plain text (development mode)
            isValidCurrentPassword = currentPassword === user.password
        }

        if (!isValidCurrentPassword) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
        }

        // Hash the new password
        const hashedNewPassword = await hashPassword(newPassword)

        // Update the password in the database
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id', userId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
        }

        return NextResponse.json({ 
            message: 'Password updated successfully' 
        }, { status: 200 })
        
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}


