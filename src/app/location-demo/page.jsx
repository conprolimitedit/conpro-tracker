'use client'
import { useState } from 'react'
import EnhancedLocationSelector from '../components/EnhancedLocationSelector'

export default function LocationDemo() {
  const [location, setLocation] = useState({
    country: '',
    region: '',
    city: '',
    town: '',
    gpsCoordinates: {
      lat: '',
      lng: ''
    }
  })

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation)
    console.log('Location changed:', newLocation)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Enhanced Location Selector Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the location selector with search functionality, custom inputs, and OpenStreetMap integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Location Selector */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Location Selection
          </h2>
          <EnhancedLocationSelector 
            location={location} 
            onLocationChange={handleLocationChange}
          />
        </div>

        {/* Current Location Display */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Selection
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Country:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {location.country || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Region:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {location.region || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">City:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {location.city || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Town:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {location.town || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">GPS:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {location.gpsCoordinates.lat && location.gpsCoordinates.lng 
                    ? `${location.gpsCoordinates.lat}, ${location.gpsCoordinates.lng}`
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Raw JSON */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Raw Location Data
            </h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(location, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          How to Use
        </h3>
        <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li><strong>Search:</strong> Type letters in the search bar to filter countries, regions, cities, and towns</li>
          <li><strong>Custom Inputs:</strong> Select "Other (Custom)" to enter custom location names</li>
          <li><strong>Map Integration:</strong> The map will automatically update when you select locations</li>
          <li><strong>GPS Coordinates:</strong> Click on the map to set coordinates or use "My Location" button</li>
          <li><strong>API Testing:</strong> Check the browser console for API response logs</li>
        </ul>
      </div>
    </div>
  )
}
