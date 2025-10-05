import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/project-coordinators - Get all project coordinators
export async function GET() {
    try {
        console.log('Fetching all project coordinators from database...')
        
        const { data, error } = await supabase
            .from('project_coordinators')
            .select('id, fullName, company, specialization, created_at')
            .order('id', { ascending: true })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch project coordinators', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} project coordinators`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            projectCoordinators: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project coordinators API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/project-coordinators - Create new project coordinator
export async function POST(request) {
    try {
        const { fullName, company, specialization } = await request.json()
        
        console.log('Creating new project coordinator:', { fullName, company, specialization })
        
        if (!fullName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: fullName, company, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('project_coordinators')
            .insert([{ fullName, company, specialization }])
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create project coordinator', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Project coordinator created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project coordinator created successfully',
            projectCoordinator: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project coordinators API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/project-coordinators - Update project coordinator
export async function PUT(request) {
    try {
        const { id, fullName, company, specialization } = await request.json()
        
        console.log('Updating project coordinator:', { id, fullName, company, specialization })
        
        if (!id || !fullName || !company || !specialization) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, fullName, company, specialization' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('project_coordinators')
            .update({ fullName, company, specialization })
            .eq('id', id)
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update project coordinator', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project coordinator not found' 
            }, { status: 404 })
        }

        console.log('Project coordinator updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project coordinator updated successfully',
            projectCoordinator: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project coordinators API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/project-coordinators - Delete project coordinator
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting project coordinator:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('project_coordinators')
            .delete()
            .eq('id', id)
            .select('id, fullName, company, specialization, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete project coordinator', 
                details: error.message 
        }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project coordinator not found' 
            }, { status: 404 })
        }

        console.log('Project coordinator deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project coordinator deleted successfully',
            projectCoordinator: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project coordinators API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
