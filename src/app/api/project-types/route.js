import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/project-types - Get all project types
export async function GET(request) {
    try {
        console.log('Fetching all project types from database...')
        const { searchParams } = new URL(request.url)
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
        const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
        const limit = Number.isNaN(limitParam) || limitParam < 1 ? 1000 : limitParam
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error } = await supabase
            .from('project_types')
            .select('id, projectType, category, description, created_at')
            .order('id', { ascending: true })
            .range(from, to)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to fetch project types', 
                details: error.message 
            }, { status: 500 })
        }

        console.log(`Successfully fetched ${data?.length || 0} project types`)
        
        return NextResponse.json({ 
            success: true,
            count: data?.length || 0,
            page,
            limit,
            projectTypes: data || []
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project types API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// POST /api/project-types - Create new project type
export async function POST(request) {
    try {
        const { projectType, category, description } = await request.json()
        
        console.log('Creating new project type:', { projectType, category, description })
        
        if (!projectType || !category) {
            return NextResponse.json({ 
                error: 'Missing required fields: projectType, category' 
            }, { status: 400 })
        }
        
        // Duplicate check on projectType (case-insensitive)
        const { data: dupCheck, error: dupErr } = await supabase
            .from('project_types')
            .select('id, projectType')
            .ilike('projectType', projectType)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck?.length || 0) > 0) {
            return NextResponse.json({ success: false, error: 'Project type with this name already exists.' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('project_types')
            .insert([{ projectType: projectType, category, description: description || null }])
            .select('id, projectType, category, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create project type', 
                details: error.message 
            }, { status: 500 })
        }

        console.log('Project type created successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project type created successfully',
            projectType: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project types API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// PUT /api/project-types - Update project type
export async function PUT(request) {
    try {
        const { id, projectType, category, description } = await request.json()
        
        console.log('Updating project type:', { id, projectType, category, description })
        
        if (!id || !projectType || !category) {
            return NextResponse.json({ 
                error: 'Missing required fields: id, projectType, category' 
            }, { status: 400 })
        }
        
        // Duplicate check excluding current id
        const { data: dupCheck, error: dupErr } = await supabase
            .from('project_types')
            .select('id, projectType')
            .ilike('projectType', projectType)
        if (dupErr) {
            console.error('Duplicate check error:', dupErr)
        }
        if ((dupCheck || []).some(row => row.id !== id)) {
            return NextResponse.json({ success: false, error: 'Project type with this name already exists.' }, { status: 409 })
        }

        const { data, error } = await supabase
            .from('project_types')
            .update({ projectType, category, description: description || null })
            .eq('id', id)
            .select('id, projectType, category, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to update project type', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project type not found' 
            }, { status: 404 })
        }

        console.log('Project type updated successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project type updated successfully',
            projectType: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project types API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}

// DELETE /api/project-types - Delete project type
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('Deleting project type:', id)
        
        if (!id) {
            return NextResponse.json({ 
                error: 'Missing required parameter: id' 
            }, { status: 400 })
        }
        
        const { data, error } = await supabase
            .from('project_types')
            .delete()
            .eq('id', id)
            .select('id, projectType, category, description, created_at')

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to delete project type', 
                details: error.message 
            }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ 
                error: 'Project type not found' 
            }, { status: 404 })
        }

        console.log('Project type deleted successfully:', data)
        
        return NextResponse.json({ 
            success: true,
            message: 'Project type deleted successfully',
            projectType: data[0]
        }, { status: 200 })
        
    } catch (error) {
        console.error('Project types API error:', error)
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 })
    }
}
