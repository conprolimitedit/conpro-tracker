'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ProjectTypesPage = () => {
  const [projectTypesData, setProjectTypesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch project types from database
  const fetchProjectTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/project-types')
      const data = await response.json()
      
      if (data.success) {
        setProjectTypesData(data.projectTypes || [])
      } else {
        setError(data.error || 'Failed to fetch project types')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectTypes()
  }, [])

  const fields = [
    { name: 'projectType', label: 'Project Type', required: true, placeholder: 'Enter project type name' },
    { name: 'category', label: 'Category', required: true, placeholder: 'e.g., Civil Engineering, Housing, Business' },
    { name: 'description', label: 'Description', required: false, type: 'textarea', placeholder: 'Enter project type description' }
  ]

  const handleSave = async (projectType, id = null) => {
    try {
      setError(null)
      
      const url = '/api/project-types'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...projectType }
        : projectType

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful save
        await fetchProjectTypes()
        return data.projectType
      } else {
        setError(data.error || 'Failed to save project type')
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      throw err
    }
  }

  const handleDelete = async (id) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/project-types?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchProjectTypes()
      } else {
        setError(data.error || 'Failed to delete project type')
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading project types...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchProjectTypes}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Project Types"
      data={projectTypesData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['projectType', 'category', 'description']}
    />
  )
}

export default ProjectTypesPage
