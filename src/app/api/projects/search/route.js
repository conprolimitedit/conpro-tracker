import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search query is required' 
      }, { status: 400 })
    }

    console.log('🔍 Searching projects for:', query)

    // Search projects by project_name using case-insensitive search
    const { data: projects, error } = await supabase
      .from('projects')
      .select('project_id, project_name, project_slug, project_status, project_location')
      .ilike('project_name', `%${query}%`)
      .order('project_name', { ascending: true })
      .limit(10) // Limit results to 10 for better performance

    if (error) {
      console.error('❌ Error searching projects:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ Found projects:', projects.length)
    return NextResponse.json({ 
      success: true, 
      projects: projects || [] 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Unexpected error searching projects:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred.' 
    }, { status: 500 })
  }
}
