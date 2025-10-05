'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ProjectCoordinatorsPage = () => {
  const [projectCoordinatorsData, setProjectCoordinatorsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch project coordinators from database
  const fetchProjectCoordinators = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/project-coordinators')
      const data = await response.json()
      
      if (data.success) {
        setProjectCoordinatorsData(data.projectCoordinators || [])
      } else {
        setError(data.error || 'Failed to fetch project coordinators')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectCoordinators()
  }, [])

  const fields = [
    { name: 'fullName', label: 'Full Name', required: true, placeholder: 'Enter coordinator full name' },
    { name: 'company', label: 'Company', required: true, placeholder: 'Enter company name' },
    { name: 'specialization', label: 'Specialization', required: true, placeholder: 'e.g., Healthcare Coordination, Infrastructure Coordination' }
  ]

  const handleSave = async (projectCoordinatorData, id = null) => {
    try {
      setError(null)
      
      const url = '/api/project-coordinators'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...projectCoordinatorData }
        : projectCoordinatorData

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
        await fetchProjectCoordinators()
        return data.projectCoordinator
      } else {
        setError(data.error || 'Failed to save project coordinator')
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
      
      const response = await fetch(`/api/project-coordinators?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchProjectCoordinators()
      } else {
        setError(data.error || 'Failed to delete project coordinator')
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
        <div className="text-lg">Loading project coordinators...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchProjectCoordinators}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Project Coordinators"
      data={projectCoordinatorsData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['fullName', 'company', 'specialization']}
    />
  )
}

export default ProjectCoordinatorsPage
