import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/contractors - Get all contractors
export async function GET() {
    try {
        console.log('Fetching all contractors from database...')
        
        const { data, error } = await supabase
            .from('contractors')
            .select('id, fullName, category, specialization, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch contractors', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} contractors`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            contractors: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Contractors API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/contractors - Create new contractor
export async function POST(request) {
    try {
        const { fullName, category, specialization } = await request.json()
        
        console.log('Creating new contractor:', { fullName, category, specialization })
        
        if (!fullName || !category || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: fullName, category, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('contractors')
            .insert([{ fullName: fullName, category, specialization }])
            .select('id, fullName, category, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create contractor', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Contractor created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Contractor created successfully',
            contractor: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Contractors API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/contractors - Update contractor
export async function PUT(request) {
    try {
        const { id, fullName, category, specialization } = await request.json()
        
        console.log('Updating contractor:', { id, fullName, category, specialization })
        
        if (!id || !fullName || !category || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, fullName, category, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('contractors')
            .update({ fullName, category, specialization })
            .eq('id', id)
            .select('id, fullName, category, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update contractor', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Contractor not found' 
            }, { status: 404 })
        }

        console.log('Contractor updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Contractor updated successfully',
            contractor: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Contractors API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/contractors - Delete contractor
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting contractor:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('contractors')
            .delete()
            .eq('id', id)
            .select('id, fullName, category, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete contractor', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Contractor not found' 
            }, { status: 404 })
        }

        console.log('Contractor deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Contractor deleted successfully',
            contractor: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Contractors API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
