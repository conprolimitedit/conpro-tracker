import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

/**
 * Helper function to resolve entity IDs to full objects with names
 * @param {Object} project - The project object with arrays of IDs
 * @returns {Object} - Project object with resolved entity data
 */
export async function resolveProjectEntities(project) {
  try {
    console.log('🔄 Resolving project entities for:', project.project_name)
    
    // Helper function to fetch entities by IDs
    const fetchEntitiesByIds = async (tableName, ids, nameField = 'name', idField = 'id') => {
      if (!ids || !Array.isArray(ids) || ids.length === 0) return []
      
      // Filter out null/undefined/empty values and convert to appropriate type
      let validIds
      if (idField === 'project_id') {
        // For projects, keep as strings (UUIDs)
        validIds = ids.filter(id => id && id.toString().trim() !== '')
      } else {
        // For other tables, convert to integers
        validIds = ids.filter(id => id && id.toString().trim() !== '').map(id => parseInt(id))
      }
      
      if (validIds.length === 0) return []
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .in(idField, validIds)
      
      if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error)
        return []
      }
      
      return data || []
    }
    
    // Resolve all entities in parallel
    const [
      clients,
      fundingAgencies,
      contractors,
      clerkOfWorks,
      projectManagers,
      projectCoordinators,
      projectTypes,
      buildingTypes,
      projectServices,
      linkedProjects
    ] = await Promise.all([
      fetchEntitiesByIds('clients', project.project_clients, 'clientName'),
      fetchEntitiesByIds('funding_agency', project.funding_agencies, 'agencyName'),
      fetchEntitiesByIds('contractors', project.contractors, 'fullName'),
      fetchEntitiesByIds('clerk_of_works', project.clerk_of_works, 'fullName'),
      fetchEntitiesByIds('project_managers', project.project_managers, 'managerName'),
      fetchEntitiesByIds('project_coordinators', project.project_coordinators, 'fullName'),
      fetchEntitiesByIds('project_types', project.project_types, 'projectType'),
      fetchEntitiesByIds('buildingTypes', project.building_types, 'buildingType'),
      fetchEntitiesByIds('services', project.project_services, 'serviceName'),
      fetchEntitiesByIds('projects', project.linked_projects, 'project_name', 'project_id')
    ])
    
    // Return the project with resolved entities
    const resolvedProject = {
      ...project,
      project_clients: clients,
      funding_agencies: fundingAgencies,
      contractors: contractors,
      clerk_of_works: clerkOfWorks,
      project_managers: projectManagers,
      project_coordinators: projectCoordinators,
      project_types: projectTypes,
      building_types: buildingTypes,
      project_services: projectServices,
      linked_projects: linkedProjects
    }
    
    console.log('✅ Successfully resolved project entities')
    return resolvedProject
    
  } catch (error) {
    console.error('❌ Error resolving project entities:', error)
    // Return original project if resolution fails
    return project
  }
}

/**
 * Helper function to resolve multiple projects' entities
 * @param {Array} projects - Array of project objects
 * @returns {Array} - Array of projects with resolved entity data
 */
export async function resolveMultipleProjectEntities(projects) {
  try {
    console.log(`🔄 Resolving entities for ${projects.length} projects`)
    
    // Resolve all projects in parallel
    const resolvedProjects = await Promise.all(
      projects.map(project => resolveProjectEntities(project))
    )
    
    console.log('✅ Successfully resolved entities for all projects')
    return resolvedProjects
    
  } catch (error) {
    console.error('❌ Error resolving multiple project entities:', error)
    return projects
  }
}
