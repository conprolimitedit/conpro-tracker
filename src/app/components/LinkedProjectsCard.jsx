import React from 'react'
import { FiX, FiMapPin } from 'react-icons/fi'

const LinkedProjectsCard = ({ projects, onRemove }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in-progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'on-hold':
      case 'on hold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'abandoned':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No linked projects selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Selected Linked Projects ({projects.length})
      </h6>
      
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <div
            key={project.id || project.project_id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 relative"
          >
            {/* Remove Button */}
            <button
              onClick={() => onRemove(project)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove project"
            >
              <FiX className="w-4 h-4" />
            </button>

            <div className="flex gap-4">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                {project.project_cover_image?.url ? (
                  <img
                    src={project.project_cover_image.url}
                    alt={project.project_name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="flex-1 min-w-0">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                  {project.project_name}
                </h6>
                
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <FiMapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {project.project_location?.mmda}, {project.project_location?.region}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {project.institution_name}
                  </p>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                    {project.project_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LinkedProjectsCard
