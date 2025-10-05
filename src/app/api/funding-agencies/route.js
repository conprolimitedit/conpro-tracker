import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/funding-agencies - Get all funding agencies
export async function GET() {
    try {
        console.log('Fetching all funding agencies from database...')
        
        const { data, error } = await supabase
            .from('funding_agency')
            .select('id, agencyName, agencyType, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch funding agencies', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} funding agencies`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            fundingAgencies: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Funding agencies API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/funding-agencies - Create new funding agency
export async function POST(request) {
    try {
        const { agencyName, agencyType } = await request.json()
        
        console.log('Creating new funding agency:', { agencyName, agencyType })
        
        if (!agencyName || !agencyType) {
            return NextResponse.json({ 
                error: 'Missing required fields: agencyName, agencyType' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('funding_agency')
            .insert([{ agencyName: agencyName, agencyType: agencyType }])
            .select('id, agencyName, agencyType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create funding agency', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Funding agency created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Funding agency created successfully',
            fundingAgency: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Funding agencies API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/funding-agencies - Update funding agency
export async function PUT(request) {
    try {
        const { id, agencyName, agencyType } = await request.json()
        
        console.log('Updating funding agency:', { id, agencyName, agencyType })
        
        if (!id || !agencyName || !agencyType) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, agencyName, agencyType' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('funding_agency')
            .update({ agencyName: agencyName, agencyType: agencyType })
            .eq('id', id)
            .select('id, agencyName, agencyType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update funding agency', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Funding agency not found' 
            }, { status: 404 })
        }

        console.log('Funding agency updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Funding agency updated successfully',
            fundingAgency: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Funding agencies API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/funding-agencies - Delete funding agency
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting funding agency:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('funding_agency')
            .delete()
            .eq('id', id)
            .select('id, agencyName, agencyType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete funding agency', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Funding agency not found' 
            }, { status: 404 })
        }

        console.log('Funding agency deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Funding agency deleted successfully',
            fundingAgency: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Funding agencies API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
