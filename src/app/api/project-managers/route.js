import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/project-managers - Get all project managers
export async function GET(request) {
    try {
        console.log('Fetching all project managers from database...')
        const { searchParams } = new URL(request.url)
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
        const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
        const limit = Number.isNaN(limitParam) || limitParam < 1 ? 1000 : limitParam
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error } = await supabase
            .from('project_managers')
            .select('id, managerName, company, specialization, created_at')
            .order('id', { ascending: true })
            .range(from, to)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch project managers', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} project managers`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            page,
            limit,
            projectManagers: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project managers API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/project-managers - Create new project manager
export async function POST(request) {
    try {
        const { managerName, company, specialization } = await request.json()
        
        console.log('Creating new project manager:', { managerName, company, specialization })
        
        if (!managerName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: managerName, company, specialization' 
            }, { status: 400 })
        }
        
        // Duplicate check on (managerName, company)
        const { data: dupCheck, error: dupErr } = await supabase
            .from('project_managers')
            .select('id, managerName, company')
            .ilike('managerName', managerName)
            .ilike('company', company)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck?.length || 0) > 0) {
            return NextResponse.json({ success: false, error: 'Project manager with this name and company already exists.' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('project_managers')
            .insert([{ managerName, company, specialization }])
            .select('id, managerName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create project manager', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Project manager created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project manager created successfully',
            projectManager: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project managers API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/project-managers - Update project manager
export async function PUT(request) {
    try {
        const { id, managerName, company, specialization } = await request.json()
        
        console.log('Updating project manager:', { id, managerName, company, specialization })
        
        if (!id || !managerName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, managerName, company, specialization' 
            }, { status: 400 })
        }
        
        // Duplicate check excluding current id
        const { data: dupCheck, error: dupErr } = await supabase
            .from('project_managers')
            .select('id, managerName, company')
            .ilike('managerName', managerName)
            .ilike('company', company)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck || []).some(row => row.id !== id)) {
            return NextResponse.json({ success: false, error: 'Project manager with this name and company already exists.' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('project_managers')
            .update({ managerName, company, specialization })
            .eq('id', id)
            .select('id, managerName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update project manager', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project manager not found' 
            }, { status: 404 })
        }

        console.log('Project manager updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project manager updated successfully',
            projectManager: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project managers API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/project-managers - Delete project manager
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting project manager:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('project_managers')
            .delete()
            .eq('id', id)
            .select('id, managerName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete project manager', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project manager not found' 
            }, { status: 404 })
        }

        console.log('Project manager deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project manager deleted successfully',
            projectManager: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project managers API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
