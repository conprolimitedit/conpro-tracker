import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/services - Get all services
export async function GET() {
    try {
        console.log('Fetching all services from database...')
        
        const { data, error } = await supabase
            .from('services')
            .select('id, serviceName, description, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch services', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} services`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            services: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Services API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/services - Create new service
export async function POST(request) {
    try {
        const { serviceName, description } = await request.json()
        
        console.log('Creating new service:', { serviceName, description })
        
        if (!serviceName || !description) {
            return NextResponse.json({ 
                error: 'Missing required fields: serviceName, description' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('services')
            .insert([{ serviceName: serviceName, description }])
            .select('id, serviceName, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create service', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Service created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Service created successfully',
            service: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Services API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/services - Update service
export async function PUT(request) {
    try {
        const { id, serviceName, description } = await request.json()
        
        console.log('Updating service:', { id, serviceName, description })
        
        if (!id || !serviceName || !description) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, serviceName, description' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('services')
            .update({ serviceName, description })
            .eq('id', id)
            .select('id, serviceName, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update service', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Service not found' 
            }, { status: 404 })
        }

        console.log('Service updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Service updated successfully',
            service: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Services API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/services - Delete service
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting service:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('services')
            .delete()
            .eq('id', id)
            .select('id, serviceName, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete service', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Service not found' 
            }, { status: 404 })
        }

        console.log('Service deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Service deleted successfully',
            service: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Services API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
