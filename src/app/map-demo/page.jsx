'use client'
import React, { useState } from 'react'
import { projects, countries, regions, cities, towns } from '../Data/Data'
import ProjectMap from '../components/Map/ProjectMap'
import LocationMap from '../components/Map/LocationMap'
import LocationSelector from '../components/LocationSelector'

const MapDemoPage = () => {
  const [selectedProject, setSelectedProject] = useState(null)
  const [location, setLocation] = useState({
    country: 'UG',
    region: 'Central Region',
    city: 'Kampala',
    town: 'Nakasero',
    gpsCoordinates: '0.3476° N, 32.5825° E'
  })

  const handleMapMarkerClick = (project) => {
    setSelectedProject(project)
  }

  // Helper function to get country name from code
  const getCountryName = (countryCode) => {
    const country = countries.find(c => c.code === countryCode)
    return country ? country.name : countryCode
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Map Integration Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            OpenStreetMap integration with project visualization and location selection
          </p>
        </div>

        {/* Projects Map */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            All Projects Map
          </h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on markers to view project details. Colors indicate priority: Red (High), Yellow (Medium), Green (Low)
            </p>
          </div>
          <ProjectMap
            projects={projects}
            height="500px"
            onMarkerClick={handleMapMarkerClick}
          />
          
          {/* Selected Project Info */}
          {selectedProject && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedProject.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {selectedProject.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">{selectedProject.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2 font-medium">{selectedProject.progress}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Client:</span>
                  <span className="ml-2 font-medium">{selectedProject.client.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-2 font-medium">{selectedProject.location.city}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Selector with Map */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Location Selector with Map Preview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <LocationSelector
                location={location}
                onLocationChange={setLocation}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Selected Location Preview
              </h3>
              <LocationMap
                gpsString={location.gpsCoordinates}
                height="300px"
                zoom={14}
              />
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Location Details:</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Country:</span> {getCountryName(location.country)}</p>
                  <p><span className="font-medium">Region:</span> {location.region}</p>
                  <p><span className="font-medium">City:</span> {location.city}</p>
                  <p><span className="font-medium">Town:</span> {location.town}</p>
                  <p><span className="font-medium">GPS:</span> {location.gpsCoordinates}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Map Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Project Visualization</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                View all projects on an interactive map with custom markers
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Priority Color Coding</h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Markers are color-coded by project priority for quick identification
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">Interactive Popups</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Click markers to see detailed project information in popups
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Location Selection</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Hierarchical location selection with real-time map preview
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-medium text-red-900 dark:text-red-300 mb-2">GPS Coordinates</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Support for GPS coordinate input with automatic map centering
              </p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <h3 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">Responsive Design</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                Maps adapt to different screen sizes and support dark mode
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapDemoPage 