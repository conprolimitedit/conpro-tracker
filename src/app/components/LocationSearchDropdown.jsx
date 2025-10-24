import React, { useState, useEffect, useRef } from 'react'
import { FiMapPin, FiX, FiChevronDown } from 'react-icons/fi'

const LocationSearchDropdown = ({ 
  selectedLocation, 
  onLocationSelect, 
  onLocationClear,
  placeholder = "Search locations..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/locations/search?search=${encodeURIComponent(searchTerm)}&limit=10`)
        const data = await response.json()
        
        if (data.success) {
          setSearchResults(data.locations)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Error searching locations:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowResults(false)
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocationSelect = (location) => {
    onLocationSelect(location)
    setSearchTerm('')
    setShowResults(false)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value.length >= 2) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true)
      setIsOpen(true)
    }
  }

  const handleClear = () => {
    onLocationClear()
    setSearchTerm('')
    setShowResults(false)
    setIsOpen(false)
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'country':
        return '🌍'
      case 'region':
        return '🗺️'
      case 'mmda':
        return '🏛️'
      case 'city_town':
        return '🏘️'
      case 'address':
        return '📍'
      default:
        return '📍'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getLocationIcon(location.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                      {location.value}
                    </h6>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {location.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No locations found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getLocationIcon(selectedLocation.type)}</span>
            <div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedLocation.value}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-300 ml-1">
                ({selectedLocation.label})
              </span>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default LocationSearchDropdown
