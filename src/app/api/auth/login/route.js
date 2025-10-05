import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Create Supabase client with SERVICE ROLE KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET

if (!supabaseUrl || !supabaseServiceKey || !jwtSecret) {
  console.error('❌ Missing required environment variables for auth API')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - User login
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔍 User login attempt:', email)

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and password are required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password, userRole, status, first_name, last_name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', email)
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ User account is inactive:', email)
      return NextResponse.json({ 
        success: false,
        error: 'Account is inactive. Please contact administrator.' 
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email)
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email or password' 
      }, { status: 401 })
    }

    // Generate JWT token (expires in 30 days)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      userRole: user.userRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    }

    const token = jwt.sign(tokenPayload, jwtSecret)

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user

    console.log('✅ User logged in successfully:', email)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('❌ Error in POST /api/auth/login:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
