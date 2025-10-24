import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit')) || 20

    if (!search || search.trim().length < 2) {
      return Response.json({
        success: true,
        projects: []
      })
    }

    // Search projects by mmda and institution_name
    const { data, error } = await supabase
      .from('projects')
      .select(`
        project_id,
        project_name,
        project_slug,
        institution_name,
        project_status,
        project_cover_image,
        project_location
      `)
      .or(`institution_name.ilike.%${search}%,project_location->>mmda.ilike.%${search}%`)
      .limit(limit)

    if (error) {
      console.error('Error searching projects:', error)
      return Response.json({
        success: false,
        error: 'Failed to search projects'
      }, { status: 500 })
    }

    // Transform the data to include parsed JSON fields
    const transformedProjects = data.map(project => ({
      id: project.project_id,
      project_id: project.project_id,
      project_name: project.project_name,
      project_slug: project.project_slug,
      institution_name: project.institution_name,
      project_status: project.project_status,
      project_cover_image: typeof project.project_cover_image === 'string' 
        ? JSON.parse(project.project_cover_image) 
        : project.project_cover_image,
      project_location: typeof project.project_location === 'string' 
        ? JSON.parse(project.project_location) 
        : project.project_location
    }))

    return Response.json({
      success: true,
      projects: transformedProjects
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}