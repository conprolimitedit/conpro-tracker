import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/clerk-of-works - Get all clerk of works
export async function GET() {
    try {
        console.log('Fetching all clerk of works from database...')
        
        const { data, error } = await supabase
            .from('clerk_of_works')
            .select('id, fullName, company, specialization, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch clerk of works', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} clerk of works`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            clerkOfWorks: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clerk of works API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/clerk-of-works - Create new clerk of works
export async function POST(request) {
    try {
        const { fullName, company, specialization } = await request.json()
        
        console.log('Creating new clerk of works:', { fullName, company, specialization })
        
        if (!fullName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: fullName, company, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('clerk_of_works')
            .insert([{ fullName: fullName, company, specialization }])
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create clerk of works', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Clerk of works created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Clerk of works created successfully',
            clerkOfWork: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clerk of works API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/clerk-of-works - Update clerk of works
export async function PUT(request) {
    try {
        const { id, fullName, company, specialization } = await request.json()
        
        console.log('Updating clerk of works:', { id, fullName, company, specialization })
        
        if (!id || !fullName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, fullName, company, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('clerk_of_works')
            .update({ fullName, company, specialization })
            .eq('id', id)
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update clerk of works', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Clerk of works not found' 
            }, { status: 404 })
        }

        console.log('Clerk of works updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Clerk of works updated successfully',
            clerkOfWork: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clerk of works API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/clerk-of-works - Delete clerk of works
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting clerk of works:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('clerk_of_works')
            .delete()
            .eq('id', id)
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete clerk of works', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Clerk of works not found' 
            }, { status: 404 })
        }

        console.log('Clerk of works deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Clerk of works deleted successfully',
            clerkOfWork: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clerk of works API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
