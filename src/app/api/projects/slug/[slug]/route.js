import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveProjectEntities } from '../../../../lib/resolveEntities'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

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
    
    // Handle image upload if cover image file is provided
    let coverImageData = null
    if (coverImageFile) {
      try {
        console.log('📤 Uploading image to Supabase Storage...')
        
        // Create FormData for image upload
        const uploadFormData = new FormData()
        uploadFormData.append('file', coverImageFile)
        uploadFormData.append('bucket', 'conproProjectsBucket')
        
        // Upload image using the upload-file API
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-file`, {
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
    const updateData = {
      project_name: body.project_name,
      project_slug: body.project_slug,
      project_deadline: formatDateField(body.project_deadline),
      project_priority: body.project_priority || 'medium',
      project_cover_image: coverImageData || body.project_cover_image || null,
      project_location: body.project_location || null,
      project_clients: body.project_clients || [],
      funding_agencies: Array.isArray(body.funding_agencies) ? body.funding_agencies : (body.funding_agencies ? [body.funding_agencies] : []),
      contractors: body.contractors || [],
      clerk_of_works: body.clerk_of_works || [],
      project_coordinators: body.project_coordinators || [],
      project_managers: body.project_managers || [],
      building_types: body.building_types || [],
      project_services: body.project_services || [],
      project_status: body.project_status || 'planning',
      project_start_date: formatDateField(body.project_start_date),
      project_end_date: formatDateField(body.project_end_date),
      handing_over_date: formatDateField(body.handing_over_date),
      revised_date: formatDateField(body.revised_date),
      linked_projects: body.linked_projects || [],
      project_description: body.project_description || '',
      project_details: body.project_details || '',
      project_special_comment: body.project_special_comment || '',
      project_completion_percentage: body.project_completion_percentage || 0,
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Prepared update data:', updateData)
    
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
    
    const { data: deletedProject, error } = await supabase
      .from('projects')
      .delete()
      .eq('project_slug', slug)
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

    console.log('✅ Project deleted successfully by slug:', deletedProject[0].project_name)
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      project: deletedProject[0]
    })
    
  } catch (error) {
    console.error('💥 Delete project by slug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
