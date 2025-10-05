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

// Custom location marker
const createLocationIcon = () => {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  return L.divIcon({
    className: 'location-marker',
    html: `
      <div style="
        background-color: #EF4444;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

// Map controller for single location
const LocationMapController = ({ coordinates, zoom }) => {
  const [map, setMap] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && coordinates && coordinates.length === 2 && map) {
      map.setView(coordinates, zoom)
    }
  }, [coordinates, zoom, map])

  return null
}

const LocationMap = ({ 
  coordinates = [0.3476, 32.5825], // Default to Kampala
  zoom = 12,
  height = '200px',
  className = '',
  gpsString = null
}) => {
  const [mapKey, setMapKey] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Parse GPS coordinates from string format if provided
  const parseCoordinates = (gpsString) => {
    if (!gpsString) return coordinates
    
    try {
      // Handle format like "0.3476° N, 32.5825° E"
      const coords = gpsString.split(',').map(coord => 
        parseFloat(coord.replace(/[°NSEW\s]/g, ''))
      )
      return coords
    } catch (error) {
      console.error('Error parsing coordinates:', error)
      return coordinates
    }
  }

  const locationCoords = parseCoordinates(gpsString)

  if (!isClient) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <LeafletCSS />
      <div className={`w-full ${className}`} style={{ height, zIndex: 1 }}>
        <MapContainer
          key={mapKey}
          center={locationCoords}
          zoom={zoom}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="rounded-lg"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationMapController coordinates={locationCoords} zoom={zoom} />

          <Marker
            position={locationCoords}
            icon={createLocationIcon()}
          />
        </MapContainer>
      </div>
    </>
  )
}

export default LocationMap 