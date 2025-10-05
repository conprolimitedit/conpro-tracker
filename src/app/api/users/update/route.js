import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Create Supabase client with SERVICE ROLE KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables for user update API')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT - Update user
export async function PUT(request) {
  try {
    const body = await request.json()
    const { userId, email, password, userRole, firstName, lastName, status } = body

    console.log('🔍 Updating user:', userId)

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid email format' 
        }, { status: 400 })
      }
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const { data: emailExists, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single()

      if (emailExists) {
        return NextResponse.json({ 
          success: false,
          error: 'User with this email already exists' 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {}
    
    if (email) updateData.email = email
    if (userRole) updateData.userRole = userRole
    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (status) updateData.status = status
    
    // Hash password if provided
    if (password) {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
      console.log('✅ Password hashed successfully')
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, created_at, email, userRole, status, first_name, last_name')
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ User updated successfully:', updatedUser.email)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('❌ Error in PUT /api/users/update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    console.log('🔍 Deleting user:', userId)

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 })
    }

    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete user',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('✅ User deleted successfully:', existingUser.email)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error in DELETE /api/users/update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
