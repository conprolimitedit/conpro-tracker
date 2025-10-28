import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveProjectEntities } from '../../../../lib/resolveEntities'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

// Helpers for projects_summary adjustments
const statusToColumn = (status) => status?.toLowerCase()?.replace(/\s+/g, '-').replace(/-/g, '_') || null
async function readSummary(sp) {
  const { data, error } = await sp.from('projects_summary').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}
async function writeSummary(sp, updated) {
  const { error } = await sp
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

// GET /api/projects/slug/[slug] - Get a specific project by slug
export async function GET(request, { params }) {
  try {
    const { slug } = params
    console.log('🚀 Fetching project by slug:', slug)
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_slug', slug)
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

    console.log('✅ Project fetched successfully by slug:', project.project_name)
    
    // Resolve entity IDs to full objects
    const resolvedProject = await resolveProjectEntities(project)
    
    return NextResponse.json({
      success: true,
      project: resolvedProject
    })
    
  } catch (error) {
    console.error('💥 Get project by slug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT /api/projects/slug/[slug] - Update a specific project by slug
export async function PUT(request, { params }) {
  try {
    const { slug } = params
    console.log('🚀 Updating project by slug:', slug)
    
    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type')
    let body, coverImageFile = null
    let oldCoverPathToDelete = null
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData request
      const formData = await request.formData()
      const projectDataString = formData.get('projectData')
      coverImageFile = formData.get('coverImage')
      
      if (!projectDataString) {
        return NextResponse.json({
          success: false,
          error: 'Project data is required'
        }, { status: 400 })
      }
      
      body = JSON.parse(projectDataString)
      console.log('📝 Project data received (FormData):', body)
      console.log('📁 Cover image file:', coverImageFile?.name)
    } else {
      // Handle JSON request
      body = await request.json()
      console.log('📝 Project data received (JSON):', body)
    }
    
    // Fetch existing project to know current cover image path (for cleanup if replaced)
    try {
      const { data: existingProject } = await supabase
        .from('projects')
        .select('project_cover_image')
        .eq('project_slug', slug)
        .single()
      oldCoverPathToDelete = existingProject?.project_cover_image?.path || null
    } catch (fetchOldErr) {
      console.warn('⚠️ Could not fetch existing project for cover cleanup:', fetchOldErr?.message)
    }
    
    // Handle image upload if cover image file is provided
    let coverImageData = null
    if (coverImageFile) {
      try {
        console.log('📤 Uploading image to Supabase Storage...')
        
        // Create FormData for image upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', coverImageFile)
        uploadFormData.append('bucket', 'conproProjectsBucket')
        
        // Upload image using the upload-file API (derive base URL from incoming request)
        const baseUrl = new URL(request.url).origin
        const uploadResponse = await fetch(`${baseUrl}/api/upload-file`, {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`Image upload failed: ${uploadResponse.status}`)
        }
        
        const uploadResult = await uploadResponse.json()
        console.log('📤 Upload response:', uploadResult)
        
        if (uploadResult.success) {
          coverImageData = {
            url: uploadResult.fileData.publicUrl,
            filename: uploadResult.fileData.name,
            size: uploadResult.fileData.size,
            type: uploadResult.fileData.type,
            path: uploadResult.fileData.path
          }
          console.log('✅ Image uploaded successfully:', coverImageData)
          // Attempt to delete previous cover image if different
          try {
            if (oldCoverPathToDelete && oldCoverPathToDelete !== coverImageData.path) {
              const { error: removeErr } = await supabase
                .storage
                .from('conproProjectsBucket')
                .remove([oldCoverPathToDelete])
              if (removeErr) {
                console.warn('⚠️ Failed to delete old cover image:', oldCoverPathToDelete, removeErr.message)
              } else {
                console.log('🧹 Deleted old cover image:', oldCoverPathToDelete)
              }
            }
          } catch (cleanupErr) {
            console.warn('⚠️ Error during old cover cleanup:', cleanupErr?.message)
          }
        } else {
          throw new Error(uploadResult.error || 'Image upload failed')
        }
      } catch (imageError) {
        console.error('❌ Image upload failed:', imageError)
        // Continue without image if upload fails
      }
    } else if (body.project_cover_image && typeof body.project_cover_image === 'string') {
      // Existing image URL
      coverImageData = {
        url: body.project_cover_image,
        filename: 'existing-image',
        size: 0,
        type: 'image/jpeg'
      }
    }
    
    // Helper function to convert empty strings to null for date fields
    const formatDateField = (dateValue) => {
      if (!dateValue || dateValue === "" || dateValue.trim() === "") {
        return null
      }
      return dateValue
    }

    // Prepare update data
    // Trim whitespace from institution name and project name
    const trimmedInstitutionName = body.institution_name ? body.institution_name.trim() : ''
    const trimmedProjectName = body.project_name ? body.project_name.trim() : ''
    
    // Set default country to Ghana if not specified
    const projectLocation = body.project_location || {}
    if (!projectLocation.country) {
      projectLocation.country = 'Ghana'
    }
    
    const updateData = {
      institution_name: trimmedInstitutionName,
      project_name: trimmedProjectName,
      project_slug: body.project_slug,
      project_priority: body.project_priority || 'medium',
      project_cover_image: coverImageData || body.project_cover_image || null,
      project_location: projectLocation,
      project_categories: Array.isArray(body.project_categories) ? body.project_categories : (body.project_categories ? [body.project_categories] : []),
      project_clients: body.project_clients || [],
      funding_agencies: Array.isArray(body.funding_agencies) ? body.funding_agencies : (body.funding_agencies ? [body.funding_agencies] : []),
      contractors: body.contractors || [],
      clerk_of_works: body.clerk_of_works || [],
      project_coordinators: body.project_coordinators || [],
      project_managers: body.project_managers || [],
      project_types: body.project_types || [],
      building_types: body.building_types || [],
      project_services: body.project_services || [],
      project_status: body.project_status || 'planning',
      project_start_date: formatDateField(body.project_start_date),
      project_end_date: formatDateField(body.project_end_date),
      contract_date: formatDateField(body.contract_date),
      site_possession_date: formatDateField(body.site_possession_date),
      handing_over_date: formatDateField(body.handing_over_date),
      revised_date: formatDateField(body.revised_date),
      linked_projects: body.linked_projects || [],
      project_description: body.project_description || '',
      project_details: body.project_details || '',
      project_special_comment: body.project_special_comment || '',
      project_completion_percentage: body.project_completion_percentage || 0,
      planned_progress: typeof body.planned_progress === 'number' ? body.planned_progress : 0,
      cumulative_progress: typeof body.cumulative_progress === 'number' ? body.cumulative_progress : 0,
      project_duration: body.project_duration || '',
      project_stage: body.project_stage || '',
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Prepared update data:', updateData)
    
    // Get old status for summary adjustment
    const { data: beforeProject } = await supabase
      .from('projects')
      .select('project_status')
      .eq('project_slug', slug)
      .single()

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('project_slug', slug)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update project',
        details: error.message
      }, { status: 500 })
    }

    if (!updatedProject || updatedProject.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    console.log('✅ Project updated successfully by slug:', updatedProject[0].project_name)

    // Adjust projects_summary for status change
    try {
      const oldStatus = beforeProject?.project_status
      const newStatus = updatedProject[0]?.project_status
      const oldCol = statusToColumn(oldStatus)
      const newCol = statusToColumn(newStatus)
      if (oldCol !== newCol) {
        const summary = await readSummary(supabase)
        const next = { ...summary }
        if (oldCol) next[oldCol] = Math.max(0, (Number(next[oldCol]) || 0) - 1)
        if (newCol) next[newCol] = (Number(next[newCol]) || 0) + 1
        await writeSummary(supabase, next)
      }
    } catch (sumErr) {
      console.warn('⚠️ Failed to update projects_summary after update:', sumErr?.message)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject[0]
    })
    
  } catch (error) {
    console.error('💥 Update project by slug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/projects/slug/[slug] - Delete a specific project by slug
export async function DELETE(request, { params }) {
  try {
    const { slug } = params
    console.log('🚀 Deleting project by slug:', slug)
    
    // Fetch project before deletion
    const { data: existingProject } = await supabase
      .from('projects')
      .select('project_id, project_cover_image, project_gallery, project_status')
      .eq('project_slug', slug)
      .single()

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    const projectId = existingProject.project_id
    
    // Find all projects that have this project in their linked_projects
    console.log('🔍 Finding projects that reference this project in linked_projects...')
    const { data: allProjects, error: fetchError } = await supabase
      .from('projects')
      .select('project_id, project_slug, linked_projects')
    
    if (fetchError) {
      console.warn('⚠️ Could not fetch all projects to check linked_projects:', fetchError.message)
    } else {
      // Update all projects that reference this project
      for (const project of allProjects) {
        if (!project.linked_projects || !Array.isArray(project.linked_projects)) continue
        
        // Check if this project is referenced
        const hasReference = project.linked_projects.some(linked => {
          if (typeof linked === 'string') {
            // If it's a JSON string, parse it
            try {
              const parsed = JSON.parse(linked)
              return parsed.project_id === projectId
            } catch {
              // If parsing fails, skip
              return false
            }
          }
          // If it's an object, check project_id directly
          return linked.project_id === projectId
        })
        
        if (hasReference) {
          console.log(`🔗 Removing reference from project: ${project.project_slug}`)
          // Filter out this project from linked_projects
          const updatedLinkedProjects = project.linked_projects.filter(linked => {
            if (typeof linked === 'string') {
              try {
                const parsed = JSON.parse(linked)
                return parsed.project_id !== projectId
              } catch {
                return linked !== projectId
              }
            }
            return linked.project_id !== projectId
          })
          
          // Update the project
          const { error: updateError } = await supabase
            .from('projects')
            .update({ linked_projects: updatedLinkedProjects })
            .eq('project_id', project.project_id)
          
          if (updateError) {
            console.warn(`⚠️ Failed to update linked_projects for project ${project.project_slug}:`, updateError.message)
          } else {
            console.log(`✅ Removed link from project: ${project.project_slug}`)
          }
        }
      }
    }

    // Get all files to delete from storage
    const filesToDelete = []
    
    // Add cover image
    if (existingProject.project_cover_image) {
      try {
        const coverImage = typeof existingProject.project_cover_image === 'string' 
          ? JSON.parse(existingProject.project_cover_image) 
          : existingProject.project_cover_image
        
        if (coverImage.path) {
          filesToDelete.push(coverImage.path)
        }
      } catch (e) {
        console.warn('⚠️ Could not parse cover image for deletion:', e.message)
      }
    }
    
    // Add gallery images
    if (existingProject.project_gallery) {
      try {
        const gallery = typeof existingProject.project_gallery === 'string'
          ? JSON.parse(existingProject.project_gallery)
          : existingProject.project_gallery
        
        if (Array.isArray(gallery)) {
          gallery.forEach(image => {
            if (typeof image === 'object' && image.path) {
              filesToDelete.push(image.path)
            }
          })
        }
      } catch (e) {
        console.warn('⚠️ Could not parse gallery images for deletion:', e.message)
      }
    }
    
    // Delete the project from database
    const { data: deletedProject, error } = await supabase
      .from('projects')
      .delete()
      .eq('project_id', projectId)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete project',
        details: error.message
      }, { status: 500 })
    }

    if (!deletedProject || deletedProject.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    console.log('✅ Project deleted successfully from database')

    // Update projects_summary
    const col = statusToColumn(existingProject?.project_status)
    const summary = await readSummary(supabase)
    const next = { ...summary }
    if (col) next[col] = Math.max(0, (Number(next[col]) || 0) - 1)
    next.total_projects = Math.max(0, (Number(next.total_projects) || 0) - 1)
    await writeSummary(supabase, next)
    console.log('✅ Updated projects_summary')
    
    // Delete all files from storage
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${filesToDelete.length} files from storage...`)
      const { data: deletedFiles, error: removeErr } = await supabase
        .storage
        .from('conproProjectsBucket')
        .remove(filesToDelete)
      
      if (removeErr) {
        console.warn('⚠️ Failed to delete some files from storage:', removeErr.message)
      } else {
        console.log('🧹 Storage files deleted:', deletedFiles?.length || 0)
      }
    }
    
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