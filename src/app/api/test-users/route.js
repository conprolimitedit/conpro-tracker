import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/test-users - Get all users (for testing purposes)
export async function GET() {
    try {
        console.log('Fetching all users from database...')
        
        // Fetch all users from database
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch users', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} users`)
        console.log('Raw data from Supabase:', data)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            users: data || [],
            message: data?.length === 0 ? 'No users found in database' : 'Users fetched successfully'
        }, { status: 200 })
        
    } catch (error) {
        console.error('Test API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/test-users - Create a test user (for testing purposes)
export async function POST() {
    try {
        console.log('Creating test user...')
        
        // Create a test user
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'testpassword123',
            name: 'Test User',
            role: 'admin'
        }
        
        const { data, error } = await supabase
            .from('users')
            .insert([testUser])
            .select()

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create test user', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Test user created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Test user created successfully',
            user: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Test API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}