import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 1000 : limitParam
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: financeDocuments, error } = await supabase
      .from('finance_documents')
      .select('id, documentType, category, description, created_at')
      .order('documentType', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching finance documents:', error)
      return NextResponse.json({ error: 'Failed to fetch finance documents' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      page,
      limit,
      financeDocuments: financeDocuments || []
    })

  } catch (error) {
    console.error('Error in GET /api/finance-documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { documentType, category, description } = await request.json()

    if (!documentType || !category) {
      return NextResponse.json({ error: 'Missing required fields: documentType, category' }, { status: 400 })
    }

    // Duplicate check (documentType + category)
    const { data: dupCheck, error: dupErr } = await supabase
      .from('finance_documents')
      .select('id')
      .ilike('documentType', documentType)
      .ilike('category', category)
    if (dupErr) console.error('Duplicate check error:', dupErr)
    if ((dupCheck?.length || 0) > 0) {
      return NextResponse.json({ success: false, error: 'A finance document with this type and category already exists.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('finance_documents')
      .insert([{ documentType, category, description: description || null }])
      .select('id, documentType, category, description, created_at')

    if (error) {
      console.error('Error creating finance document:', error)
      return NextResponse.json({ error: 'Failed to create finance document' }, { status: 500 })
    }

    return NextResponse.json({ success: true, financeDocument: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/finance-documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, documentType, category, description } = await request.json()

    if (!id || !documentType || !category) {
      return NextResponse.json({ error: 'Missing required fields: id, documentType, category' }, { status: 400 })
    }

    // Duplicate check excluding current id
    const { data: dupCheck, error: dupErr } = await supabase
      .from('finance_documents')
      .select('id')
      .ilike('documentType', documentType)
      .ilike('category', category)
    if (dupErr) console.error('Duplicate check error:', dupErr)
    if ((dupCheck || []).some(row => row.id !== id)) {
      return NextResponse.json({ success: false, error: 'A finance document with this type and category already exists.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('finance_documents')
      .update({ documentType, category, description: description || null })
      .eq('id', id)
      .select('id, documentType, category, description, created_at')

    if (error) {
      console.error('Error updating finance document:', error)
      return NextResponse.json({ error: 'Failed to update finance document' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Finance document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, financeDocument: data[0] }, { status: 200 })
  } catch (error) {
    console.error('Error in PUT /api/finance-documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing required parameter: id' }, { status: 400 })

    const { data, error } = await supabase
      .from('finance_documents')
      .delete()
      .eq('id', id)
      .select('id, documentType, category, description, created_at')

    if (error) {
      console.error('Error deleting finance document:', error)
      return NextResponse.json({ error: 'Failed to delete finance document' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Finance document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, financeDocument: data[0] }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/finance-documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}