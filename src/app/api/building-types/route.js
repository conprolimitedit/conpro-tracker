import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/building-types - Get all building types
export async function GET() {
    try {
        console.log('Fetching all building types from database...')
        
        const { data, error } = await supabase
            .from('buildingTypes')
            .select('id, buildingType, category, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch building types', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} building types`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            buildingTypes: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Building types API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/building-types - Create new building type
export async function POST(request) {
    try {
        const { buildingType, category } = await request.json()
        
        console.log('Creating new building type:', { buildingType, category })
        
        if (!buildingType || !category) {
            return NextResponse.json({ 
                error: 'Building type and category are required' 
            }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('buildingTypes')
            .insert([{
                buildingType,
                category
            }])
            .select('id, buildingType, category, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create building type', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Building type created successfully:', data[0])
        
        return NextResponse.json({ 
            success: true,
            message: 'Building type created successfully',
            buildingType: data[0]
        }, { status: 201 })
        
    } catch (error) {
        console.error('Create building type error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/building-types - Update building type
export async function PUT(request) {
    try {
        const { id, buildingType, category } = await request.json()
        
        console.log('Updating building type:', { id, buildingType, category })
        
        if (!id || !buildingType || !category) {
            return NextResponse.json({ 
                error: 'ID, building type and category are required' 
            }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('buildingTypes')
            .update({
                buildingType,
                category
            })
            .eq('id', id)
            .select('id, buildingType, category, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update building type', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Building type not found' 
            }, { status: 404 })
        }

        console.log('Building type updated successfully:', data[0])
        
        return NextResponse.json({ 
            success: true,
            message: 'Building type updated successfully',
            buildingType: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Update building type error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/building-types - Delete building type
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting building type with ID:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'ID is required' 
            }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('buildingTypes')
            .delete()
            .eq('id', id)
            .select('id, buildingType, category, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete building type', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Building type not found' 
            }, { status: 404 })
        }

        console.log('Building type deleted successfully:', data[0])
        
        return NextResponse.json({ 
            success: true,
            message: 'Building type deleted successfully',
            buildingType: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Delete building type error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
