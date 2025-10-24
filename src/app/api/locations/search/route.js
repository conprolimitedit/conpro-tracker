import { supabase } from '@/app/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit')) || 10

    if (!search || search.trim().length < 2) {
      return Response.json({
        success: true,
        locations: []
      })
    }

    // Search for distinct locations
    const { data, error } = await supabase
      .from('projects')
      .select('project_location')
      .or(`project_location->>mmda.ilike.%${search}%,project_location->>region.ilike.%${search}%,project_location->>country.ilike.%${search}%,project_location->>city_town.ilike.%${search}%,project_location->>address.ilike.%${search}%`)
      .not('project_location', 'is', null)
      .limit(100) // Get more to ensure we have enough distinct results

    if (error) {
      console.error('Error searching locations:', error)
      return Response.json({
        success: false,
        error: 'Failed to search locations'
      }, { status: 500 })
    }

    // Process and deduplicate locations
    const locationMap = new Map()
    
    data.forEach(item => {
      if (item.project_location) {
        const location = typeof item.project_location === 'string' 
          ? JSON.parse(item.project_location) 
          : item.project_location

        // Create unique keys for different location types
        const keys = [
          { key: 'mmda', value: location.mmda, label: 'MMDA' },
          { key: 'region', value: location.region, label: 'Region' },
          { key: 'country', value: location.country, label: 'Country' },
          { key: 'city_town', value: location.city_town, label: 'City/Town' },
          { key: 'address', value: location.address, label: 'Address' }
        ]

        keys.forEach(({ key, value, label }) => {
          if (value && value.trim() !== '') {
            const searchLower = search.toLowerCase()
            const valueLower = value.toLowerCase()
            
            if (valueLower.includes(searchLower)) {
              const uniqueKey = `${key}-${value}`
              if (!locationMap.has(uniqueKey)) {
                locationMap.set(uniqueKey, {
                  id: uniqueKey,
                  type: key,
                  label: label,
                  value: value,
                  fullLocation: location,
                  displayText: `${value} (${label})`
                })
              }
            }
          }
        })
      }
    })

    // Convert map to array and sort by type priority and value
    const locations = Array.from(locationMap.values())
      .sort((a, b) => {
        // Sort by type priority: country > region > mmda > city_town > address
        const typeOrder = { country: 1, region: 2, mmda: 3, city_town: 4, address: 5 }
        const aOrder = typeOrder[a.type] || 6
        const bOrder = typeOrder[b.type] || 6
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }
        
        // Then sort alphabetically by value
        return a.value.localeCompare(b.value)
      })
      .slice(0, limit)

    return Response.json({
      success: true,
      locations: locations
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
