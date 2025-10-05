'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import LeafletCSS from './LeafletCSS'

// Dynamically import react-leaflet components to prevent SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const useMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMap),
  { ssr: false }
)

// Custom marker icons for different project types
const createCustomIcon = (color = '#3B82F6') => {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

// Map controller component for handling map interactions
const MapController = ({ center, zoom, projects, isBackground = false }) => {
  const [map, setMap] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && map) {
      const L = require('leaflet')
      
      if (center && map) {
        map.setView(center, zoom)
      }

      if (projects && projects.length > 0 && map) {
        const bounds = L.latLngBounds(projects.map(project => {
          if (project.project_location?.gpsCoordinates) {
            return parseCoordinates(project.project_location.gpsCoordinates)
          }
          return [7.9465, -1.0232] // Default to Ghana coordinates
        }))
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [center, zoom, projects, map])

  return null
}

const ProjectMap = ({ 
  projects = [], 
  center = [7.9465, -1.0232], // Default to Ghana center (Accra)
  zoom = 7,
  height = '400px',
  showPopup = true,
  onMarkerClick = null,
  className = '',
  isBackground = false
}) => {
  const [mapKey, setMapKey] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Parse GPS coordinates from object or string format
  const parseCoordinates = (gpsData) => {
    try {
      // Handle object format like { lat: "8.0300284", lng: "-1.0800271" }
      if (typeof gpsData === 'object' && gpsData !== null) {
        return [parseFloat(gpsData.lat), parseFloat(gpsData.lng)]
      }
      
      // Handle string format like "7.9465° N, -1.0232° W" or "0.3476° N, 32.5825° E"
      if (typeof gpsData === 'string') {
        const coords = gpsData.split(',').map(coord => 
          parseFloat(coord.replace(/[°NSEW\s]/g, ''))
        )
        return coords
      }
      
      // Default fallback
      return [7.9465, -1.0232] // Default to Ghana coordinates
    } catch (error) {
      console.error('Error parsing coordinates:', error)
      return [7.9465, -1.0232] // Default to Ghana coordinates
    }
  }

  // Get marker color based on project status
  const getMarkerColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10B981' // Green
      case 'in progress':
        return '#3B82F6' // Blue
      case 'planning':
        return '#F59E0B' // Yellow
      case 'on hold':
        return '#EF4444' // Red
      default:
        return '#6B7280' // Gray
    }
  }

  // Get marker color based on priority
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#EF4444' // Red
      case 'medium':
        return '#F59E0B' // Yellow
      case 'low':
        return '#10B981' // Green
      default:
        return '#3B82F6' // Blue
    }
  }

  const handleMarkerClick = (project) => {
    if (onMarkerClick) {
      onMarkerClick(project)
    }
  }

  if (!isClient) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <LeafletCSS />
      <div className={`w-full ${className}`} style={{ height }}>
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          zoomControl={true}
          attributionControl={true}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          whenCreated={(map) => {
            // Store map reference for controller
            if (typeof window !== 'undefined') {
              const L = require('leaflet')
              // Enable all interactions
              map.on('click', () => {
                // Allow map clicks
              })
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={center} zoom={zoom} projects={projects} isBackground={isBackground} />

          {projects.map((project) => {
            if (!project.project_location?.gpsCoordinates) {
              return null // Skip projects without coordinates
            }
            
            const coordinates = parseCoordinates(project.project_location.gpsCoordinates)
            const markerColor = getPriorityColor(project.project_priority)
            
            return (
              <Marker
                key={project.project_id}
                position={coordinates}
                icon={createCustomIcon(markerColor)}
                eventHandlers={{
                  click: () => handleMarkerClick(project)
                }}
              >
                {showPopup && (
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {project.project_name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {project.project_description || 'No description available'}
                      </p>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-medium ${
                            project.project_status === 'completed' ? 'text-green-600' :
                            project.project_status === 'in-progress' ? 'text-blue-600' :
                            project.project_status === 'planning' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {project.project_status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">Priority:</span>
                          <span className="font-medium text-gray-900">
                            {project.project_priority}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">Client:</span>
                          <span className="font-medium text-gray-900">
                            {project.project_clients?.length > 0 ? `Client ${project.project_clients[0]}` : 'Unknown'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium text-gray-900">
                            {project.project_location.city}, {project.project_location.region}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Deadline:</span>
                          <span className="text-xs font-medium text-gray-900">
                            {project.project_deadline ? new Date(project.project_deadline).toLocaleDateString() : 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </>
  )
}

export default ProjectMap 