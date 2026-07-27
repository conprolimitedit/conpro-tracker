import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveMultipleProjectEntities } from '../../lib/resolveEntities'
import {
  buildMultiFieldIlikeOr,
  PROJECT_SEARCH_FIELDS,
  quotePostgrestValue,
} from '../../lib/postgrestSearch'

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

async function incrementSummaryFor(status) {
  const column = statusToColumn(status)
  if (!column) return
  const summary = await readSummary()
  const next = { ...summary }
  next[column] = (Number(next[column]) || 0) + 1
  next.total_projects = (Number(next.total_projects) || 0) + 1
  await writeSummary(next)
}

async function adjustSummaryOnUpdate(oldStatus, newStatus) {
  const oldCol = statusToColumn(oldStatus)
  const newCol = statusToColumn(newStatus)
  if (!oldCol && !newCol) return
  if (oldCol === newCol) return
  const summary = await readSummary()
  const next = { ...summary }
  if (oldCol) next[oldCol] = Math.max(0, (Number(next[oldCol]) || 0) - 1)
  if (newCol) next[newCol] = (Number(next[newCol]) || 0) + 1
  // total unchanged on update
  await writeSummary(next)
}

async function decrementSummaryFor(status) {
  const column = statusToColumn(status)
  if (!column) return
  const summary = await readSummary()
  const next = { ...summary }
  next[column] = Math.max(0, (Number(next[column]) || 0) - 1)
  next.total_projects = Math.max(0, (Number(next.total_projects) || 0) - 1)
  await writeSummary(next)
}

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

    // Read filter params
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const clientId = searchParams.get('clientId') || ''
    const contractorId = searchParams.get('contractorId') || ''
    const cowId = searchParams.get('cowId') || ''
    const serviceId = searchParams.get('serviceId') || ''
    const buildingTypeId = searchParams.get('buildingTypeId') || ''
    const buildingTypeIdExact = searchParams.get('buildingTypeIdExact') || ''
    const projectTypeId = searchParams.get('projectTypeId') || ''
    const projectCategoryId = searchParams.get('projectCategoryId') || ''
    const fundingAgencyId = searchParams.get('fundingAgencyId') || ''
    const projectManagerId = searchParams.get('projectManagerId') || ''
    const projectCoordinatorId = searchParams.get('projectCoordinatorId') || ''
    const locationType = searchParams.get('locationType') || ''
    const locationValue = searchParams.get('locationValue') || ''
    const search = searchParams.get('search') || ''
    const projectId = searchParams.get('projectId') || ''
    const projectSlug = searchParams.get('projectSlug') || ''
    const buildingTypeSearch = searchParams.get('buildingTypeSearch') || ''
    const contractDate = searchParams.get('contractDate') || ''
    const projectStartDate = searchParams.get('projectStartDate') || ''
    const projectEndDate = searchParams.get('projectEndDate') || ''

    // Base query
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('project_status', status)
    }
    if (priority) {
      query = query.eq('project_priority', priority)
    }
    if (clientId) {
      query = query.contains('project_clients', [clientId])
    }
    if (contractorId) {
      query = query.contains('contractors', [contractorId])
    }
    if (cowId) {
      query = query.contains('clerk_of_works', [cowId])
    }
    if (serviceId) {
      query = query.contains('project_services', [serviceId])
    }
    if (buildingTypeIdExact) {
      // exact id match within array
      query = query.contains('building_types', [buildingTypeIdExact])
    } else if (buildingTypeId) {
      query = query.contains('building_types', [buildingTypeId])
    }
    if (projectTypeId) {
      query = query.contains('project_types', [projectTypeId])
    }
    if (projectCategoryId) {
      query = query.contains('project_categories', [projectCategoryId])
    }
    if (fundingAgencyId) {
      query = query.contains('funding_agencies', [fundingAgencyId])
    }
    if (projectManagerId) {
      query = query.contains('project_managers', [projectManagerId])
    }
    if (projectCoordinatorId) {
      query = query.contains('project_coordinators', [projectCoordinatorId])
    }
    if (locationType && locationValue) {
      query = query.eq(`project_location->>${locationType}`, locationValue)
    }
    // Exact project pin takes precedence over free-text search
    if (projectId) {
      query = query.eq('project_id', projectId)
    } else if (projectSlug) {
      query = query.eq('project_slug', projectSlug)
    } else if (search) {
      // Quoted ilike so commas/parentheses in names do not break PostgREST .or() parsing
      query = query.or(buildMultiFieldIlikeOr(PROJECT_SEARCH_FIELDS, search))
    }

    // Structure free-text search (building types by name/category/code)
    if (buildingTypeSearch) {
      const btPattern = quotePostgrestValue(`%${buildingTypeSearch}%`)
      const { data: btRows, error: btErr } = await supabase
        .from('building_types')
        .select('id')
        .or(`buildingType.ilike.${btPattern},category.ilike.${btPattern},code.ilike.${btPattern}`)
        .limit(200)
      if (btErr) {
        console.warn('⚠️ building_types search error:', btErr.message)
      }
      const ids = (btRows || []).map(r => r.id).filter(Boolean)
      if (ids.length === 0) {
        // Short-circuit: nothing will match
        return NextResponse.json({ success: true, count: 0, projects: [], message: 'No projects found' })
      }
      // Match any of the found IDs
      query = query.overlaps('building_types', ids)
    }

    // Date filters (equals match)
    if (contractDate) {
      query = query.eq('contract_date', contractDate)
    }
    if (projectStartDate) {
      query = query.eq('project_start_date', projectStartDate)
    }
    if (projectEndDate) {
      query = query.eq('project_end_date', projectEndDate)
    }

    // Apply pagination last
    let { data: projects, error } = await query.range(from, to)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch projects',
        details: error.message
      }, { status: 500 })
    }

    // Fallback: if free-text search returned nothing, try exact project_name match
    const anyOtherFilters = Boolean(status || priority || clientId || contractorId || cowId || serviceId || buildingTypeId || buildingTypeIdExact || projectTypeId || projectCategoryId || fundingAgencyId || projectManagerId || projectCoordinatorId || locationType || locationValue || buildingTypeSearch || contractDate || projectStartDate || projectEndDate)
    if (search && !projectId && !projectSlug && (!projects || projects.length === 0) && !anyOtherFilters) {
      const { data: exactProjects, error: exactErr } = await supabase
        .from('projects')
        .select('*')
        .eq('project_name', search)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (!exactErr && exactProjects && exactProjects.length > 0) {
        projects = exactProjects
      }
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
    
    // Validate location fields - use mmda instead of city
    const locationFields = ['country', 'region', 'mmda']
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
    // Trim whitespace from institution name and project name
    const trimmedInstitutionName = body.institution_name ? body.institution_name.trim() : ''
    const trimmedProjectName = body.project_name ? body.project_name.trim() : ''
    
    // Set default country to Ghana if not specified
    const projectLocation = body.project_location || {}
    if (!projectLocation.country) {
      projectLocation.country = 'Ghana'
    }
    
    const projectData = {
      institution_name: trimmedInstitutionName,
      project_name: trimmedProjectName,
      project_slug: body.project_slug,
      project_priority: body.project_priority || 'medium',
      project_cover_image: coverImageData || {},
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
      project_stage: body.project_stage || ''
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
    // Update projects_summary (increment new status, total)
    try {
      await incrementSummaryFor(newProject[0]?.project_status)
    } catch (sumErr) {
      console.warn('⚠️ Failed to update projects_summary after create:', sumErr?.message)
    }
    
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
