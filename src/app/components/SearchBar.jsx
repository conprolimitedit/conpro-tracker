'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const SearchBar = ({ placeholder = "Search projects, contractors, clients...", onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResults && !event.target.closest('.search-container')) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  // Search projects API function
  const searchProjects = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/projects/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.projects || [])
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchTerm)
    }
    searchProjects(searchTerm)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Trigger API search with debounce
    const timeoutId = setTimeout(() => {
      searchProjects(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="relative w-full m search-container">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#29166F] focus:border-[#29166F] sm:text-sm transition-colors duration-200"
            placeholder={placeholder}
          />

          {/* Clear Button */}
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  if (onSearch) onSearch('')
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Search Results */}
      {showResults && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
              {isSearching ? 'Searching...' : `Found ${searchResults.length} project${searchResults.length !== 1 ? 's' : ''}`}
            </div>
            
            {isSearching ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((project) => (
                <Link
                  key={project.project_id}
                  href={`/projects/${project.project_slug}/overview`}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    setShowResults(false)
                    setSearchTerm('')
                  }}
                >
                  <div className="font-medium text-gray-900">{project.project_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {project.project_location?.city}, {project.project_location?.region} • 
                    Status: <span className="capitalize">{project.project_status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No projects found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
