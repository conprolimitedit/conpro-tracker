import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/clients - Get all clients
export async function GET(request) {
    try {
        console.log('Fetching all clients from database...')
        const { searchParams } = new URL(request.url)
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
        const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
        const limit = Number.isNaN(limitParam) || limitParam < 1 ? 1000 : limitParam
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error } = await supabase
            .from('clients')
            .select('id, clientName, clientType, created_at')
            .order('id', { ascending: true })
            .range(from, to)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch clients', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} clients`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            page,
            limit,
            clients: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clients API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/clients - Create new client
export async function POST(request) {
    try {
        const { clientName, clientType } = await request.json()
        
        console.log('Creating new client:', { clientName, clientType })
        
        if (!clientName || !clientType) {
            return NextResponse.json({ 
                error: 'Missing required fields: clientName, clientType' 
            }, { status: 400 })
        }

        // Duplicate check on clientName (case-insensitive)
        const { data: dupCheck, error: dupErr } = await supabase
            .from('clients')
            .select('id, clientName')
            .ilike('clientName', clientName)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck?.length || 0) > 0) {
            return NextResponse.json({ success: false, error: 'Client with this name already exists.' }, { status: 409 })
        }
        
        const { data, error } = await supabase
            .from('clients')
            .insert([{ clientName: clientName, clientType: clientType }])
            .select('id, clientName, clientType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create client', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Client created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Client created successfully',
            client: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clients API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/clients - Update client
export async function PUT(request) {
    try {
        const { id, clientName, clientType } = await request.json()
        
        console.log('Updating client:', { id, clientName, clientType })
        
        if (!id || !clientName || !clientType) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, clientName, clientType' 
            }, { status: 400 })
        }
        
        // Duplicate check on clientName excluding current id
        const { data: dupCheck, error: dupErr } = await supabase
            .from('clients')
            .select('id, clientName')
            .ilike('clientName', clientName)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck || []).some(row => row.id !== id)) {
            return NextResponse.json({ success: false, error: 'Client with this name already exists.' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('clients')
            .update({ clientName, clientType })
            .eq('id', id)
            .select('id, clientName, clientType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update client', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Client not found' 
            }, { status: 404 })
        }

        console.log('Client updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Client updated successfully',
            client: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clients API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/clients - Delete client
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting client:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .select('id, clientName, clientType, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete client', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Client not found' 
            }, { status: 404 })
        }

        console.log('Client deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Client deleted successfully',
            client: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Clients API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
