import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabaseClient'

/**
 * Distinct cities from existing project locations, filtered by country
 * (and optionally region). Used when the external cities API fails.
 *
 * GET /api/locations/cities?country=Ghana&region=Ashanti
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = (searchParams.get('country') || '').trim()
    const region = (searchParams.get('region') || '').trim()

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'country is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('projects')
      .select('project_location')
      .not('project_location', 'is', null)
      .ilike('project_location->>country', country)
      .limit(1000)

    if (region) {
      query = query.ilike('project_location->>region', region)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching cities from projects:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cities from projects' },
        { status: 500 }
      )
    }

    const cityMap = new Map()

    for (const item of data || []) {
      const location =
        typeof item.project_location === 'string'
          ? JSON.parse(item.project_location)
          : item.project_location

      if (!location) continue

      // City dropdown maps to mmda; city_town is also a place name people enter
      const candidates = [location.mmda, location.city_town, location.city]
      for (const value of candidates) {
        if (typeof value !== 'string') continue
        const name = value.trim()
        if (!name) continue
        const key = name.toLowerCase()
        if (!cityMap.has(key)) {
          cityMap.set(key, name)
        }
      }
    }

    const cities = Array.from(cityMap.values())
      .sort((a, b) => a.localeCompare(b))
      .map((name, index) => ({
        id: index + 1,
        name,
        country,
        region: region || undefined,
        type: 'City',
        source: 'Database',
      }))

    return NextResponse.json({
      success: true,
      cities,
      count: cities.length,
    })
  } catch (error) {
    console.error('Unexpected error fetching cities from projects:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
