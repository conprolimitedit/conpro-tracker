import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Build the query with all filters
    let query = supabase.from('projects').select('project_id', { count: 'exact', head: true })
    
    // Apply search filter
    const search = searchParams.get('search')
    if (search) {
      query = query.or(`project_name.ilike.%${search}%,project_description.ilike.%${search}%,institution_name.ilike.%${search}%,project_location->>mmda.ilike.%${search}%,project_location->>region.ilike.%${search}%,project_location->>country.ilike.%${search}%,project_location->>address.ilike.%${search}%,project_location->>city_town.ilike.%${search}%`)
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
    if (buildingTypeId && buildingTypeId !== 'all') {
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

    const { count, error } = await query

    if (error) {
      console.error('Error getting project count:', error)
      return Response.json({
        success: false,
        error: 'Failed to get project count'
      }, { status: 500 })
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
