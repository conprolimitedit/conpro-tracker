import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveMultipleProjectEntities } from '../../lib/resolveEntities'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

// GET /api/projects - Get all projects (paginated)
export async function GET(request) {
  try {
    console.log('🚀 Fetching all projects...')

    // Read pagination params
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '10', 10)
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch projects',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Successfully fetched ${projects?.length || 0} projects`)
    
    // Resolve entity IDs to full objects for all projects
    const resolvedProjects = await resolveMultipleProjectEntities(projects || [])
    
    return NextResponse.json({
      success: true,
      count: resolvedProjects?.length || 0,
      projects: resolvedProjects || [],
      message: resolvedProjects?.length === 0 ? 'No projects found' : 'Projects fetched successfully'
    })
    
  } catch (error) {
    console.error('💥 Projects API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    console.log('🚀 Creating new project...')
    
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
    
    // Validate required fields
    const requiredFields = ['project_name', 'project_slug']
    const missingFields = requiredFields.filter(field => !body[field])
    
    // Validate location fields
    const locationFields = ['country', 'region', 'city']
    const missingLocationFields = locationFields.filter(field => !body.project_location || !body.project_location[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }
    
    if (missingLocationFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required location fields: ${missingLocationFields.join(', ')}`
      }, { status: 400 })
    }
    
    // Helper function to convert empty strings to null for date fields
    const formatDateField = (dateValue) => {
      if (!dateValue || dateValue === "" || dateValue.trim() === "") {
        return null
      }
      return dateValue
    }

    // Prepare project data for insertion
    const projectData = {
      project_name: body.project_name,
      project_slug: body.project_slug,
      project_priority: body.project_priority || 'medium',
      project_cover_image: coverImageData || {},
      project_location: body.project_location || {},
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
      project_duration: body.project_duration || ''
    }
    
    console.log('📝 Prepared project data:', projectData)
    
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create project',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Project created successfully:', newProject)
    
    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: newProject[0]
    }, { status: 201 })
    
  } catch (error) {
    console.error('💥 Create project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
