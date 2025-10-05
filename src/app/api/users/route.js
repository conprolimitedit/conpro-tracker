import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Create Supabase client with SERVICE ROLE KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables for users API')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all users
export async function GET(request) {
  try {
    console.log('🔍 Fetching all users')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, created_at, email, userRole, status, first_name, last_name')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching users:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch users',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Found users:', users?.length || 0)

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error) {
    console.error('❌ Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, userRole, firstName, lastName, status } = body

    console.log('🔍 Creating new user:', email)

    // Validate required fields
    if (!email || !password || !userRole) {
      return NextResponse.json({ 
        success: false,
        error: 'Email, password, and user role are required' 
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'User with this email already exists' 
      }, { status: 400 })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log('✅ Password hashed successfully')

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        userRole,
        first_name: firstName || '',
        last_name: lastName || '',
        status: status || 'active'
      })
      .select('id, created_at, email, userRole, status, first_name, last_name')
      .single()

    if (createError) {
      console.error('❌ Error creating user:', createError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create user',
        details: createError.message 
      }, { status: 500 })
    }

    console.log('✅ User created successfully:', newUser.email)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('❌ Error in POST /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}