'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ClerkOfWorksPage = () => {
  const [clerkOfWorksData, setClerkOfWorksData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch clerk of works from database
  const fetchClerkOfWorks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/clerk-of-works')
      const data = await response.json()
      
      if (data.success) {
        setClerkOfWorksData(data.clerkOfWorks || [])
      } else {
        setError(data.error || 'Failed to fetch clerk of works')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClerkOfWorks()
  }, [])

  const fields = [
    { name: 'fullName', label: 'Full Name', required: true, placeholder: 'Enter full name' },
    { name: 'company', label: 'Company', required: true, placeholder: 'Enter company name' },
    { name: 'specialization', label: 'Specialization', required: true, placeholder: 'e.g., Residential Projects, Commercial Buildings' }
  ]

  const handleSave = async (clerkOfWork, id = null) => {
    try {
      setError(null)
      
      const url = '/api/clerk-of-works'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...clerkOfWork }
        : clerkOfWork

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
        await fetchClerkOfWorks()
        return data.clerkOfWork
      } else {
        setError(data.error || 'Failed to save clerk of works')
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
      
      const response = await fetch(`/api/clerk-of-works?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchClerkOfWorks()
      } else {
        setError(data.error || 'Failed to delete clerk of works')
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
        <div className="text-lg">Loading clerk of works...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchClerkOfWorks}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Clerk of Works"
      data={clerkOfWorksData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['fullName', 'company', 'specialization']}
    />
  )
}

export default ClerkOfWorksPage
