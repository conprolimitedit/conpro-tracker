import { supabase } from '@/app/lib/supabaseClient'
import {
  buildMultiFieldIlikeOr,
  PROJECT_SEARCH_FIELDS,
  quotePostgrestValue,
} from '@/app/lib/postgrestSearch'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build the query with all filters
    let query = supabase.from('projects').select('project_id', { count: 'exact', head: true })
    
    // Exact project pin takes precedence over free-text search
    const projectId = searchParams.get('projectId')
    const projectSlug = searchParams.get('projectSlug')
    const search = searchParams.get('search')
    if (projectId) {
      query = query.eq('project_id', projectId)
    } else if (projectSlug) {
      query = query.eq('project_slug', projectSlug)
    } else if (search) {
      query = query.or(buildMultiFieldIlikeOr(PROJECT_SEARCH_FIELDS, search))
    }
    
    // Apply status filter
    const status = searchParams.get('status')
    if (status && status !== 'all') {
      query = query.eq('project_status', status)
    }
    
    // Apply priority filter
    const priority = searchParams.get('priority')
    if (priority && priority !== 'all') {
      query = query.eq('project_priority', priority)
    }
    
    // Apply location filter
    const locationType = searchParams.get('locationType')
    const locationValue = searchParams.get('locationValue')
    if (locationType && locationValue) {
      query = query.eq(`project_location->>${locationType}`, locationValue)
    }
    
    // Apply other filters
    const clientId = searchParams.get('clientId')
    if (clientId && clientId !== 'all') {
      query = query.contains('project_clients', [clientId])
    }
    
    const contractorId = searchParams.get('contractorId')
    if (contractorId && contractorId !== 'all') {
      query = query.contains('contractors', [contractorId])
    }
    
    const cowId = searchParams.get('cowId')
    if (cowId && cowId !== 'all') {
      query = query.contains('clerk_of_works', [cowId])
    }
    
    const serviceId = searchParams.get('serviceId')
    if (serviceId && serviceId !== 'all') {
      query = query.contains('project_services', [serviceId])
    }
    
    const buildingTypeId = searchParams.get('buildingTypeId')
    const buildingTypeIdExact = searchParams.get('buildingTypeIdExact')
    if (buildingTypeIdExact) {
      query = query.contains('building_types', [buildingTypeIdExact])
    } else if (buildingTypeId && buildingTypeId !== 'all') {
      query = query.contains('building_types', [buildingTypeId])
    }
    
    const projectTypeId = searchParams.get('projectTypeId')
    if (projectTypeId && projectTypeId !== 'all') {
      query = query.contains('project_types', [projectTypeId])
    }
    
    const projectCategoryId = searchParams.get('projectCategoryId')
    if (projectCategoryId && projectCategoryId !== 'all') {
      query = query.contains('project_categories', [projectCategoryId])
    }
    
    const fundingAgencyId = searchParams.get('fundingAgencyId')
    if (fundingAgencyId && fundingAgencyId !== 'all') {
      query = query.contains('funding_agencies', [fundingAgencyId])
    }
    
    const projectManagerId = searchParams.get('projectManagerId')
    if (projectManagerId && projectManagerId !== 'all') {
      query = query.contains('project_managers', [projectManagerId])
    }
    
    const projectCoordinatorId = searchParams.get('projectCoordinatorId')
    if (projectCoordinatorId && projectCoordinatorId !== 'all') {
      query = query.contains('project_coordinators', [projectCoordinatorId])
    }

    // Structure free-text search (building types by name/category/code)
    const buildingTypeSearch = searchParams.get('buildingTypeSearch')
    if (buildingTypeSearch) {
      const btPattern = quotePostgrestValue(`%${buildingTypeSearch}%`)
      const { data: btRows, error: btErr } = await supabase
        .from('building_types')
        .select('id')
        .or(`buildingType.ilike.${btPattern},category.ilike.${btPattern},code.ilike.${btPattern}`)
        .limit(200)
      if (!btErr) {
        const ids = (btRows || []).map(r => r.id).filter(Boolean)
        if (ids.length === 0) {
          return Response.json({ success: true, totalCount: 0 })
        }
        query = query.overlaps('building_types', ids)
      }
    }

    // Date filters (equals match)
    const contractDate = searchParams.get('contractDate')
    const projectStartDate = searchParams.get('projectStartDate')
    const projectEndDate = searchParams.get('projectEndDate')
    if (contractDate) query = query.eq('contract_date', contractDate)
    if (projectStartDate) query = query.eq('project_start_date', projectStartDate)
    if (projectEndDate) query = query.eq('project_end_date', projectEndDate)

    let { count, error } = await query

    if (error) {
      console.error('Error getting project count:', error)
      return Response.json({
        success: false,
        error: 'Failed to get project count'
      }, { status: 500 })
    }

    // Align with list API: exact project_name fallback when free-text search returns 0
    const anyOtherFilters = Boolean(
      (status && status !== 'all') ||
      (priority && priority !== 'all') ||
      (clientId && clientId !== 'all') ||
      (contractorId && contractorId !== 'all') ||
      (cowId && cowId !== 'all') ||
      (serviceId && serviceId !== 'all') ||
      (buildingTypeId && buildingTypeId !== 'all') ||
      buildingTypeIdExact ||
      (projectTypeId && projectTypeId !== 'all') ||
      (projectCategoryId && projectCategoryId !== 'all') ||
      (fundingAgencyId && fundingAgencyId !== 'all') ||
      (projectManagerId && projectManagerId !== 'all') ||
      (projectCoordinatorId && projectCoordinatorId !== 'all') ||
      (locationType && locationValue) ||
      buildingTypeSearch ||
      contractDate ||
      projectStartDate ||
      projectEndDate
    )
    if (search && !projectId && !projectSlug && (count === 0 || count == null) && !anyOtherFilters) {
      const { count: exactCount, error: exactErr } = await supabase
        .from('projects')
        .select('project_id', { count: 'exact', head: true })
        .eq('project_name', search)
      if (!exactErr && typeof exactCount === 'number') {
        count = exactCount
      }
    }

    return Response.json({
      success: true,
      totalCount: count || 0
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
