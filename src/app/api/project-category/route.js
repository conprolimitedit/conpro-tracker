import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

// GET /api/project-category - Get categories (paginated)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 1000 : limitParam
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error } = await supabase
      .from('project_category')
      .select('id, category, description, created_at')
      .order('id', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch project categories', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, page, limit, count: data?.length || 0, projectCategories: data || [] }, { status: 200 })
  } catch (error) {
    console.error('Project category API GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// POST /api/project-category - Create category
export async function POST(request) {
  try {
    const { category, description } = await request.json()

    if (!category) {
      return NextResponse.json({ error: 'Missing required field: category' }, { status: 400 })
    }

    // Duplicate check on category (case-insensitive)
    const { data: dupCheck, error: dupErr } = await supabase
      .from('project_category')
      .select('id')
      .ilike('category', category)
    if (dupErr) console.error('Duplicate check error:', dupErr)
    if ((dupCheck?.length || 0) > 0) {
      return NextResponse.json({ success: false, error: 'Project category with this name already exists.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('project_category')
      .insert([{ category, description: description || null }])
      .select('id, category, description, created_at')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create project category', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, projectCategory: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Project category API POST error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// PUT /api/project-category - Update category
export async function PUT(request) {
  try {
    const { id, category, description } = await request.json()

    if (!id || !category) {
      return NextResponse.json({ error: 'Missing required fields: id, category' }, { status: 400 })
    }

    // Duplicate check excluding current id
    const { data: dupCheck, error: dupErr } = await supabase
      .from('project_category')
      .select('id')
      .ilike('category', category)
    if (dupErr) console.error('Duplicate check error:', dupErr)
    if ((dupCheck || []).some(row => row.id !== id)) {
      return NextResponse.json({ success: false, error: 'Project category with this name already exists.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('project_category')
      .update({ category, description: description || null })
      .eq('id', id)
      .select('id, category, description, created_at')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update project category', details: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Project category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, projectCategory: data[0] }, { status: 200 })
  } catch (error) {
    console.error('Project category API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// DELETE /api/project-category - Delete category
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 })

    const { data, error } = await supabase
      .from('project_category')
      .delete()
      .eq('id', id)
      .select('id, category, description, created_at')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete project category', details: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Project category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, projectCategory: data[0] }, { status: 200 })
  } catch (error) {
    console.error('Project category API DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


