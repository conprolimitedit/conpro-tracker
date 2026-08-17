import { supabase } from '@/app/lib/supabaseClient'
import {
  aggregateStatusCounts,
  STATUS_CARD_CONFIG,
} from '@/app/lib/projectStatuses'

export async function GET() {
  try {
    // Always compute live from projects so new statuses appear without schema lag
    const { data: projects, error } = await supabase
      .from('projects')
      .select('project_status')

    if (error) {
      console.error('Error fetching projects for summary:', error)
      return Response.json(
        { success: false, error: 'Failed to fetch projects summary' },
        { status: 500 }
      )
    }

    const counts = aggregateStatusCounts(projects || [])

    return Response.json({
      success: true,
      summary: {
        ...counts,
        last_updated: new Date().toISOString(),
      },
      statusConfig: STATUS_CARD_CONFIG,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/** Optional: refresh cached projects_summary row (best-effort if columns exist) */
export async function POST() {
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('project_status')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return Response.json(
        { success: false, error: 'Failed to fetch projects for summary calculation' },
        { status: 500 }
      )
    }

    const counts = aggregateStatusCounts(projects || [])

    // Best-effort cache update — ignore missing-column errors for new statuses
    const { error: upsertError } = await supabase.from('projects_summary').upsert({
      id: 1,
      planning: counts.planning,
      in_progress: counts.in_progress,
      completed: counts.completed,
      on_hold: counts.on_hold,
      terminated: counts.terminated,
      abandoned: counts.abandoned,
      cancelled: counts.cancelled,
      design: counts.design,
      yet_to_start: counts.yet_to_start,
      total_projects: counts.total_projects,
      last_updated: new Date().toISOString(),
    })

    if (upsertError) {
      console.warn('Could not cache projects_summary (columns may be missing):', upsertError.message)
    }

    return Response.json({
      success: true,
      message: 'Projects summary refreshed successfully',
      summary: counts,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
