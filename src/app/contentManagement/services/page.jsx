'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ServicesPage = () => {
  const [servicesData, setServicesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch services from database
  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/services')
      const data = await response.json()
      
      if (data.success) {
        setServicesData(data.services || [])
      } else {
        setError(data.error || 'Failed to fetch services')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const fields = [
    { name: 'serviceName', label: 'Service Name', required: true, placeholder: 'Enter service name' },
    { name: 'description', label: 'Description', required: true, placeholder: 'Enter service description', type: 'textarea' }
  ]

  const handleSave = async (service, id = null) => {
    try {
      setError(null)
      
      const url = '/api/services'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...service }
        : service

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
        await fetchServices()
        return data.service
      } else {
        setError(data.error || 'Failed to save service')
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
      
      const response = await fetch(`/api/services?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchServices()
      } else {
        setError(data.error || 'Failed to delete service')
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
        <div className="text-lg">Loading services...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchServices}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Services"
      data={servicesData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['serviceName', 'description']}
    />
  )
}

export default ServicesPage
