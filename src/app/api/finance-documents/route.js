import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabaseClient'

export async function GET() {
  try {
    const { data: financeDocuments, error } = await supabase
      .from('finance_documents')
      .select('*')
      .order('documentType', { ascending: true })

    if (error) {
      console.error('Error fetching finance documents:', error)
      return NextResponse.json({ error: 'Failed to fetch finance documents' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      financeDocuments: financeDocuments || []
    })

  } catch (error) {
    console.error('Error in GET /api/finance-documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}