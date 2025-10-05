'use client'
import React, { useState, useEffect } from 'react'
import { FiMapPin } from 'react-icons/fi'
import { countries, regions, cities, towns } from '../Data/Data'
import LocationMap from './Map/LocationMap'

const LocationSelector = ({ location, onLocationChange }) => {
  const [selectedCountry, setSelectedCountry] = useState(location?.country || '')
  const [selectedRegion, setSelectedRegion] = useState(location?.region || '')
  const [selectedCity, setSelectedCity] = useState(location?.city || '')
  const [selectedTown, setSelectedTown] = useState(location?.town || '')
  const [gpsCoordinates, setGpsCoordinates] = useState(location?.gpsCoordinates || { lat: '', lng: '' })

  // Filter options based on selections
  const availableRegions = regions.filter(region => 
    !selectedCountry || region.country === selectedCountry
  )
  
  const availableCities = cities.filter(city => 
    !selectedRegion || city.region === selectedRegion
  )
  
  const availableTowns = towns.filter(town => 
    !selectedCity || town.city === selectedCity
  )

  // Generate GPS string for map
  const generateGpsString = () => {
    if (gpsCoordinates.lat && gpsCoordinates.lng) {
      return `${gpsCoordinates.lat}° N, ${gpsCoordinates.lng}° E`
    }
    return null
  }

  // Update location when selections change
  useEffect(() => {
    const newLocation = {
      country: selectedCountry,
      region: selectedRegion,
      city: selectedCity,
      town: selectedTown,
      gpsCoordinates: generateGpsString()
    }
    onLocationChange(newLocation)
  }, [selectedCountry, selectedRegion, selectedCity, selectedTown, gpsCoordinates, onLocationChange])

  // Reset dependent fields when parent changes
  const handleCountryChange = (country) => {
    setSelectedCountry(country)
    setSelectedRegion('')
    setSelectedCity('')
    setSelectedTown('')
  }

  const handleRegionChange = (region) => {
    setSelectedRegion(region)
    setSelectedCity('')
    setSelectedTown('')
  }

  const handleCityChange = (city) => {
    setSelectedCity(city)
    setSelectedTown('')
  }

  const handleGpsChange = (field, value) => {
    setGpsCoordinates(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-4">
      {/* Country and Region - Two per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country *
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region *
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            disabled={!selectedCountry}
          >
            <option value="">Select Region</option>
            {availableRegions.map((region) => (
              <option key={region.id} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* City and Town - Two per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City *
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            disabled={!selectedRegion}
          >
            <option value="">Select City</option>
            {availableCities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Town
          </label>
          <select
            value={selectedTown}
            onChange={(e) => setSelectedTown(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!selectedCity}
          >
            <option value="">Select Town</option>
            {availableTowns.map((town) => (
              <option key={town.id} value={town.name}>
                {town.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GPS Coordinates - Two per row */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GPS Coordinates
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Latitude
            </label>
            <input
              type="text"
              value={gpsCoordinates.lat}
              onChange={(e) => handleGpsChange('lat', e.target.value)}
              placeholder="e.g., 0.3476"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Longitude
            </label>
            <input
              type="text"
              value={gpsCoordinates.lng}
              onChange={(e) => handleGpsChange('lng', e.target.value)}
              placeholder="e.g., 32.5825"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location Preview
        </label>
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <LocationMap 
            gpsString={generateGpsString()}
            height="250px"
            zoom={gpsCoordinates.lat && gpsCoordinates.lng ? 14 : 8}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Enter GPS coordinates above to see the exact location on the map
        </p>
      </div>
    </div>
  )
}

export default LocationSelector 