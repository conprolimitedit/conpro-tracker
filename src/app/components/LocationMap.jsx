'use client'
import React, { useEffect, useRef, useState } from 'react'
import { FiMapPin, FiNavigation, FiTarget } from 'react-icons/fi'

const LocationMap = ({ location, onLocationChange, className = "" }) => {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const resizeObserver = useRef(null)

  // Initialize OpenStreetMap with Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const loadMap = async () => {
      try {
        // Wait for the DOM element to be ready and properly mounted
        if (!mapRef.current || !mapRef.current.parentNode) {
          console.warn('Map container not ready yet')
          return
        }

        // Additional check to ensure the element is visible and has dimensions
        const rect = mapRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          console.warn('Map container has no dimensions yet')
          return
        }

        // Dynamically import Leaflet JS (handle default export interop)
        const leafletModule = await import('leaflet')
        const L = leafletModule.default ?? leafletModule

        // Ensure Leaflet CSS is present once
        const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        const hasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => l.href === cssHref)
        if (!hasCss) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = cssHref
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
          link.crossOrigin = ''
          document.head.appendChild(link)
        }

        // If the container already has a map (Strict Mode race), reuse it
        if (mapRef.current && mapRef.current._leaflet_id) {
          // Attempt to reattach to an existing map instance stored on the node
          if (mapRef.current._leaflet_map) {
            mapInstance.current = mapRef.current._leaflet_map
          }
          setIsMapLoaded(true)
          setMapError(null)
          return
        }

        // Double-check that the container is still available
        if (!mapRef.current) {
          console.warn('Map container disappeared during initialization')
          return
        }

        // Initialize map safely with error handling
        try {
          mapInstance.current = L.map(mapRef.current).setView([0, 0], 2)
          
          // Store reference on the DOM node to reattach across Strict Mode remounts
          if (mapRef.current) {
            mapRef.current._leaflet_map = mapInstance.current
          }
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance.current)

          setIsMapLoaded(true)
          setMapError(null)

          // Set up resize observer to handle container size changes
          if (resizeObserver.current) {
            resizeObserver.current.disconnect()
          }
          
          resizeObserver.current = new ResizeObserver(() => {
            if (mapInstance.current) {
              try {
                mapInstance.current.invalidateSize()
              } catch (error) {
                console.warn('Error invalidating map size:', error)
              }
            }
          })
          
          if (mapRef.current) {
            resizeObserver.current.observe(mapRef.current)
          }
        } catch (mapError) {
          console.error('Error initializing map:', mapError)
          if (retryCount < 3) {
            console.log(`Retrying map initialization (${retryCount + 1}/3)`)
            setRetryCount(prev => prev + 1)
            setTimeout(() => {
              if (mapRef.current && !mapInstance.current) {
                loadMap()
              }
            }, 1000 * (retryCount + 1)) // Exponential backoff
            return
          }
          setMapError('Failed to initialize map. Please try again.')
          return
        }
      } catch (error) {
        console.error('Error loading map:', error)
        if (retryCount < 3) {
          console.log(`Retrying map loading (${retryCount + 1}/3)`)
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            if (mapRef.current && !mapInstance.current) {
              loadMap()
            }
          }, 1000 * (retryCount + 1)) // Exponential backoff
          return
        }
        setMapError('Failed to load map. Please refresh the page.')
      }
    }

    // Add a small delay to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      loadMap()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (resizeObserver.current) {
        resizeObserver.current.disconnect()
        resizeObserver.current = null
      }
      if (mapInstance.current) {
        try {
          mapInstance.current.remove()
        } catch (error) {
          console.warn('Error removing map:', error)
        }
        mapInstance.current = null
        if (mapRef.current && mapRef.current._leaflet_map) {
          delete mapRef.current._leaflet_map
        }
      }
    }
  }, [])

  // Update map when location changes
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return

    const updateMap = async () => {
      try {
        const L = await import('leaflet')
        
        // Clear existing marker
        if (markerRef.current) {
          mapInstance.current.removeLayer(markerRef.current)
          markerRef.current = null
        }

        // If we have GPS coordinates, use them
        if (location.gpsCoordinates?.lat && location.gpsCoordinates?.lng) {
          const lat = parseFloat(location.gpsCoordinates.lat)
          const lng = parseFloat(location.gpsCoordinates.lng)
          
          if (!isNaN(lat) && !isNaN(lng)) {
            // Add marker
            markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current)
            
            // Center map on marker
            mapInstance.current.setView([lat, lng], 10)
            
            // Add popup with location info
            const popupContent = `
              <div class="p-2">
                <strong>${location.country || 'Unknown Country'}</strong><br>
                ${location.region ? `${location.region}<br>` : ''}
                ${location.city ? `${location.city}<br>` : ''}
                ${location.town ? `${location.town}<br>` : ''}
                <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
              </div>
            `
            markerRef.current.bindPopup(popupContent)
            return
          }
        }

        // If no GPS coordinates, try to geocode the location
        if (location.country || location.region || location.city) {
          const searchQuery = [location.city, location.region, location.country]
            .filter(Boolean)
            .join(', ')
          
          if (searchQuery) {
            try {
              // Use Nominatim (OpenStreetMap's geocoding service)
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
              )
              
              if (response.ok) {
                const data = await response.json()
                
                if (data.length > 0) {
                  const { lat, lon } = data[0]
                  const latNum = parseFloat(lat)
                  const lngNum = parseFloat(lon)
                  
                  // Add marker
                  markerRef.current = L.marker([latNum, lngNum]).addTo(mapInstance.current)
                  
                  // Center map on marker
                  mapInstance.current.setView([latNum, lngNum], 8)
                  
                  // Add popup
                  const popupContent = `
                    <div class="p-2">
                      <strong>${location.country || 'Unknown Country'}</strong><br>
                      ${location.region ? `${location.region}<br>` : ''}
                      ${location.city ? `${location.city}<br>` : ''}
                      ${location.town ? `${location.town}<br>` : ''}
                      <small>${latNum.toFixed(4)}, ${lngNum.toFixed(4)}</small>
                    </div>
                  `
                  markerRef.current.bindPopup(popupContent)
                  
                  // Update GPS coordinates in location
                  onLocationChange({
                    ...location,
                    gpsCoordinates: {
                      lat: latNum.toString(),
                      lng: lngNum.toString()
                    }
                  })
                }
              }
            } catch (geocodeError) {
              console.log('Geocoding failed:', geocodeError)
              // Keep map centered on default view
              mapInstance.current.setView([0, 0], 2)
            }
          }
        }
      } catch (error) {
        console.error('Error updating map:', error)
      }
    }

    updateMap()
  }, [location, isMapLoaded, onLocationChange])

  // Reverse geocoding function to get location details from coordinates
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('Reverse geocoding result:', data)
        
        // Extract location information from the response
        const address = data.address || {}
        
        // Map Nominatim fields to our location structure
        const locationData = {
          country: address.country || '',
          region: address.state || address.province || address.region || '',
          city: address.city || address.town || address.village || '',
          town: address.suburb || address.neighbourhood || address.district || '',
          gpsCoordinates: {
            lat: lat.toString(),
            lng: lng.toString()
          }
        }
        
        // Update the location with all available information
        onLocationChange({
          ...location,
          ...locationData
        })
        
        return locationData
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error)
    } finally {
      setIsGeocoding(false)
    }
    
    // Fallback: just update coordinates if geocoding fails
    onLocationChange({
      ...location,
      gpsCoordinates: {
        lat: lat.toString(),
        lng: lng.toString()
      }
    })
  }

  // Handle map click to set coordinates and auto-fill location fields
  const handleMapClick = async (e) => {
    if (!mapInstance.current) return

    try {
      const L = await import('leaflet')
      
      // Clear existing marker
      if (markerRef.current) {
        mapInstance.current.removeLayer(markerRef.current)
      }

      // Add new marker
      markerRef.current = L.marker([e.latlng.lat, e.latlng.lng]).addTo(mapInstance.current)
      
      // Add popup
      const popupContent = `
        <div class="p-2">
          <strong>Selected Location</strong><br>
          <small>${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}</small>
        </div>
      `
      markerRef.current.bindPopup(popupContent).openPopup()
      
      // Reverse geocode to get location details
      await reverseGeocode(e.latlng.lat, e.latlng.lng)
    } catch (error) {
      console.error('Error handling map click:', error)
    }
  }

  // Add click event listener to map
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return

    mapInstance.current.on('click', handleMapClick)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', handleMapClick)
      }
    }
  }, [isMapLoaded])

  // Manual retry function
  const retryMapLoad = () => {
    setMapError(null)
    setRetryCount(0)
    setIsMapLoaded(false)
    if (mapInstance.current) {
      try {
        mapInstance.current.remove()
      } catch (error) {
        console.warn('Error removing existing map:', error)
      }
      mapInstance.current = null
    }
    
    // Wait a bit then retry
    setTimeout(() => {
      if (mapRef.current) {
        const loadMap = async () => {
          try {
            const leafletModule = await import('leaflet')
            const L = leafletModule.default ?? leafletModule

            if (!mapRef.current) return

            mapInstance.current = L.map(mapRef.current).setView([0, 0], 2)
            
            if (mapRef.current) {
              mapRef.current._leaflet_map = mapInstance.current
            }
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current)

            setIsMapLoaded(true)
            setMapError(null)
          } catch (error) {
            console.error('Error retrying map load:', error)
            setMapError('Failed to load map. Please try again.')
          }
        }
        loadMap()
      }
    }, 500)
  }

  // Get current coordinates button
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          if (mapInstance.current) {
            // Center map on current location
            mapInstance.current.setView([latitude, longitude], 12)
            
            // Add marker for current location
            if (markerRef.current) {
              mapInstance.current.removeLayer(markerRef.current)
            }
            
            import('leaflet').then(L => {
              markerRef.current = L.marker([latitude, longitude]).addTo(mapInstance.current)
              
              const popupContent = `
                <div class="p-2">
                  <strong>Your Current Location</strong><br>
                  <small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
                </div>
              `
              markerRef.current.bindPopup(popupContent).openPopup()
            })
            
            // Use reverse geocoding to get location details
            reverseGeocode(latitude, longitude)
          }
        },
        (error) => {
          console.error('Error getting current location:', error)
          alert('Unable to get your current location. Please check your browser permissions.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          <FiMapPin className="inline w-5 h-5 mr-2" />
          Location Map
        </h3>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            title="Get current location"
          >
            <FiNavigation className="w-4 h-4" />
            <span>My Location</span>
          </button>
          
          {location.gpsCoordinates?.lat && location.gpsCoordinates?.lng && (
            <button
              type="button"
              onClick={() => {
                if (mapInstance.current && markerRef.current) {
                  const lat = parseFloat(location.gpsCoordinates.lat)
                  const lng = parseFloat(location.gpsCoordinates.lng)
                  if (!isNaN(lat) && !isNaN(lng)) {
                    mapInstance.current.setView([lat, lng], 12)
                  }
                }
              }}
              className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              title="Center on selected location"
            >
              <FiTarget className="w-4 h-4" />
              <span>Center</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div
          ref={mapRef}
          className="w-full h-96 bg-gray-100 rounded-lg border border-gray-300"
          style={{ zIndex: 1 }}
        />
        
        {!isMapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center text-red-600">
              <p className="mb-2">{mapError}</p>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={retryMapLoad}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry Map
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geocoding Status */}
      {isGeocoding && (
        <div className="flex items-center justify-center py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Auto-filling location fields...
          </span>
        </div>
      )}

      {/* Map Instructions */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p className="mb-2"><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click anywhere on the map to set GPS coordinates and auto-fill location fields</li>
          <li>Use "My Location" to get your current position and auto-fill location fields</li>
          <li>Use "Center" to focus on your selected location</li>
          <li>The map will automatically update when you select a location</li>
          <li>Location fields (Country, Region, City, Town) will be automatically filled based on map selection</li>
        </ul>
      </div>
    </div>
  )
}

export default LocationMap
