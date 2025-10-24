import React, { useState, useEffect } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import LinkedProjectsCard from './LinkedProjectsCard'

const LinkedProjectsSelector = ({ selectedProjects, onSelectionChange, placeholder = "Search projects by MMDA or Institution..." }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

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
        const response = await fetch(`/api/projects/search?search=${encodeURIComponent(searchTerm)}&limit=10`)
        const data = await response.json()
        
        if (data.success) {
          // Filter out already selected projects
          const filteredResults = data.projects.filter(project => 
            !selectedProjects.some(selected => 
              selected.id === project.id || selected.project_id === project.project_id
            )
          )
          setSearchResults(filteredResults)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Error searching projects:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedProjects])

  const handleProjectSelect = (project) => {
    const newSelection = [...selectedProjects, project]
    onSelectionChange(newSelection)
    setSearchTerm('')
    setShowResults(false)
  }

  const handleProjectRemove = (projectToRemove) => {
    const newSelection = selectedProjects.filter(project => 
      project.id !== projectToRemove.id && project.project_id !== projectToRemove.project_id
    )
    onSelectionChange(newSelection)
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200)
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
            {searchResults.map((project) => (
              <div
                key={project.id || project.project_id}
                onClick={() => handleProjectSelect(project)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {/* Project Image */}
                  <div className="flex-shrink-0">
                    {project.project_cover_image?.url ? (
                      <img
                        src={project.project_cover_image.url}
                        alt={project.project_name}
                        className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <h6 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                      {project.project_name}
                    </h6>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                      {project.institution_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                      {project.project_location?.mmda}, {project.project_location?.region}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.project_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      project.project_status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      project.project_status === 'planning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {project.project_status}
                    </span>
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
              No projects found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>

      {/* Selected Projects Display */}
      <LinkedProjectsCard 
        projects={selectedProjects} 
        onRemove={handleProjectRemove} 
      />
    </div>
  )
}

export default LinkedProjectsSelector
