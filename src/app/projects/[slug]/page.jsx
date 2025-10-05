'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiFileText } from 'react-icons/fi'

const ProjectPage = () => {
  const params = useParams()
  const router = useRouter()
  const { slug } = params
  const isNewProject = slug === 'addNewProject'
  
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isNewProject) {
      // Redirect to overview page for new projects
      router.push(`/projects/${slug}/overview`)
      return
    } else {
      // Fetch existing project data
      fetchProjectData(slug)
    }
  }, [slug, isNewProject, router])

  const fetchProjectData = async (projectId) => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/projects/${projectId}`)
      // const data = await response.json()
      
      // Mock data for now
      const mockData = {
        id: projectId,
        name: 'Sample Project',
        status: 'in-progress',
        // Add other project data
      }
      
      setProjectData(mockData)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectData?.name || 'Project'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your project documentation and phases
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {projectData?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a section</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose a section from the navigation to get started.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectPage
