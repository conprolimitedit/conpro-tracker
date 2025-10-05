'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ProjectManagersPage = () => {
  const [projectManagersData, setProjectManagersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch project managers from database
  const fetchProjectManagers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/project-managers')
      const data = await response.json()
      
      if (data.success) {
        setProjectManagersData(data.projectManagers || [])
      } else {
        setError(data.error || 'Failed to fetch project managers')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectManagers()
  }, [])

  const fields = [
    { name: 'managerName', label: 'Manager Name', required: true, placeholder: 'Enter manager full name' },
    { name: 'company', label: 'Company', required: true, placeholder: 'Enter company name' },
    { name: 'specialization', label: 'Specialization', required: true, placeholder: 'e.g., Healthcare Projects, Infrastructure Projects' }
  ]

  const handleSave = async (projectManagerData, id = null) => {
    try {
      setError(null)
      
      const url = '/api/project-managers'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...projectManagerData }
        : projectManagerData

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
        await fetchProjectManagers()
        return data.projectManager
      } else {
        setError(data.error || 'Failed to save project manager')
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
      
      const response = await fetch(`/api/project-managers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchProjectManagers()
      } else {
        setError(data.error || 'Failed to delete project manager')
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
        <div className="text-lg">Loading project managers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchProjectManagers}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Project Managers"
      data={projectManagersData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['managerName', 'company', 'specialization']}
    />
  )
}

export default ProjectManagersPage
