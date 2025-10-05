import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Create Supabase client with SERVICE ROLE KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  console.error('❌ Missing required environment variables for auth verify API')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Verify JWT token
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'No token provided' 
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    console.log('🔍 Verifying token...')

    // Verify JWT token
    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      console.log('❌ Invalid token:', jwtError.message)
      return NextResponse.json({ 
        success: false,
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    // Check if token has required fields
    if (!decoded.userId || !decoded.email) {
      console.log('❌ Token missing required fields')
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token format' 
      }, { status: 401 })
    }

    // Fetch current user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, userRole, status, first_name, last_name')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      console.log('❌ User not found in database:', decoded.userId)
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 401 })
    }

    // Check if user is still active
    if (user.status !== 'active') {
      console.log('❌ User account is inactive:', user.email)
      return NextResponse.json({ 
        success: false,
        error: 'Account is inactive' 
      }, { status: 401 })
    }

    // Check if user role has changed
    if (user.userRole !== decoded.userRole) {
      console.log('❌ User role has changed:', user.email)
      return NextResponse.json({ 
        success: false,
        error: 'User role has changed. Please login again.' 
      }, { status: 401 })
    }

    console.log('✅ Token verified successfully for user:', user.email)

    return NextResponse.json({
      success: true,
      message: 'Token verified successfully',
      user
    })

  } catch (error) {
    console.error('❌ Error in POST /api/auth/verify:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
