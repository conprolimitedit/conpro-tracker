import { supabase } from '@/app/lib/supabaseClient'

export async function GET() {
  try {
    // Fetch the summary data from projects_summary table
    const { data, error } = await supabase
      .from('projects_summary')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching projects summary:', error)
      return Response.json({
        success: false,
        error: 'Failed to fetch projects summary'
      }, { status: 500 })
    }

    // If no summary data exists, return zeros
    if (!data) {
      return Response.json({
        success: true,
        summary: {
          planning: 0,
          in_progress: 0,
          completed: 0,
          on_hold: 0,
          terminated: 0,
          abandoned: 0,
          cancelled: 0,
          total_projects: 0,
          last_updated: new Date().toISOString()
        }
      })
    }

    return Response.json({
      success: true,
      summary: {
        planning: data.planning || 0,
        in_progress: data.in_progress || 0,
        completed: data.completed || 0,
        on_hold: data.on_hold || 0,
        terminated: data.terminated || 0,
        abandoned: data.abandoned || 0,
        cancelled: data.cancelled || 0,
        total_projects: data.total_projects || 0,
        last_updated: data.last_updated
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Optional: Add a POST endpoint to manually refresh the summary
export async function POST() {
  try {
    // Recalculate summary from projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('project_status')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return Response.json({
        success: false,
        error: 'Failed to fetch projects for summary calculation'
      }, { status: 500 })
    }

    // Calculate counts
    const counts = {
      planning: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      terminated: 0,
      abandoned: 0,
      cancelled: 0,
      total_projects: projects.length
    }

    projects.forEach(project => {
      const status = project.project_status
      if (counts.hasOwnProperty(status)) {
        counts[status]++
      }
    })

    // Upsert the summary
    const { error: upsertError } = await supabase
      .from('projects_summary')
      .upsert({
        id: 1, // Assuming single row with id = 1
        ...counts,
        last_updated: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error upserting summary:', upsertError)
      return Response.json({
        success: false,
        error: 'Failed to update projects summary'
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Projects summary refreshed successfully',
      summary: counts
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
