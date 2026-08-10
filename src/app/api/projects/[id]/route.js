import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { humanizeDbError } from '../../../lib/apiError'
import { resolveProjectEntities } from '../../../lib/resolveEntities'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

// --- Helpers for projects_summary updates ---
const statusToColumn = (status) => {
  if (!status) return null
  return status.toLowerCase().replace(/\s+/g, '-').replace(/-/g, '_')
}

async function readSummary() {
  const { data, error } = await supabase
    .from('projects_summary')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

async function writeSummary(updated) {
  const { error } = await supabase
    .from('projects_summary')
    .update({
      planning: updated.planning,
      in_progress: updated.in_progress,
      completed: updated.completed,
      on_hold: updated.on_hold,
      terminated: updated.terminated,
      abandoned: updated.abandoned,
      cancelled: updated.cancelled,
      total_projects: updated.total_projects,
      last_updated: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) throw error
}

// GET /api/projects/[id] - Get a specific project
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log('🚀 Fetching project:', id)
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', id)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch project',
        details: error.message
      }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    console.log('✅ Project fetched successfully:', project.project_name)
    
    // Resolve entity IDs to full objects
    const resolvedProject = await resolveProjectEntities(project)
    
    return NextResponse.json({
      success: true,
      project: resolvedProject
    })
    
  } catch (error) {
    console.error('💥 Get project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log('🚀 Updating project:', id)
    
    const body = await request.json()
    console.log('📝 Update data received:', body)
    
    // Prepare update data
    const updateData = {
      project_name: body.project_name,
      project_slug: body.project_slug,
      project_deadline: body.project_deadline || null,
      project_priority: body.project_priority || 'medium',
      project_cover_image: body.project_cover_image || null,
      project_location: body.project_location || null,
      project_clients: body.project_clients || [],
      funding_agencies: body.funding_agencies || [],
      contractors: body.contractors || [],
      clerk_of_works: body.clerk_of_works || [],
      project_coordinators: body.project_coordinators || [],
      project_managers: body.project_managers || [],
      building_types: body.building_types || [],
      project_services: body.project_services || [],
      project_status: body.project_status || 'planning',
      project_start_date: body.project_start_date || null,
      project_end_date: body.project_end_date || null,
      handing_over_date: body.handing_over_date || null,
      revised_date: body.revised_date || null,
      linked_projects: body.linked_projects || [],
      project_description: body.project_description || '',
      project_details: body.project_details || '',
      project_special_comment: body.project_special_comment || '',
      project_completion_percentage: body.project_completion_percentage || 0,
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('project_id', id)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: humanizeDbError(error),
        details: error.message,
        code: error.code || null
      }, { status: 500 })
    }

    if (!updatedProject || updatedProject.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    console.log('✅ Project updated successfully:', updatedProject[0].project_name)
    
    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject[0]
    })
    
  } catch (error) {
    console.error('💥 Update project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log('🚀 Deleting project:', id)

    // Fetch existing to get status for summary update
    const { data: existingProject } = await supabase
      .from('projects')
      .select('project_status')
      .eq('project_id', id)
      .single()
    
    const { data: deletedProject, error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', id)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: humanizeDbError(error),
        details: error.message,
        code: error.code || null
      }, { status: 500 })
    }

    if (!deletedProject || deletedProject.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    // Update projects_summary (always decrement total, decrement status bucket if present)
    try {
      const col = statusToColumn(existingProject?.project_status)
      const summary = await readSummary()
      const next = { ...summary }
      if (col) next[col] = Math.max(0, (Number(next[col]) || 0) - 1)
      next.total_projects = Math.max(0, (Number(next.total_projects) || 0) - 1)
      await writeSummary(next)
      console.log('✅ Updated projects_summary after delete')
    } catch (sumErr) {
      console.warn('⚠️ Failed to update projects_summary after delete:', sumErr?.message)
    }

    console.log('✅ Project deleted successfully:', deletedProject[0].project_name)
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      project: deletedProject[0]
    })
    
  } catch (error) {
    console.error('💥 Delete project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
