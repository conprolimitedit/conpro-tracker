'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const BuildingTypesPage = () => {
  const [buildingTypesData, setBuildingTypesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch building types from database
  const fetchBuildingTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/building-types')
      const data = await response.json()
      
      if (data.success) {
        setBuildingTypesData(data.buildingTypes || [])
      } else {
        setError(data.error || 'Failed to fetch building types')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuildingTypes()
  }, [])

  const structureOptions = [
    'Dormitory',
    'Hostel', 
    'Classroom',
    'Lecture Block',
    'Administration',
    'Library',
    'Auditorium',
    'Multi-purpose Hall',
    'Dining Hall',
    'Staff Flat',
    'Bungalow',
    'Sick Bay',
    'Lavatories',
    'Park',
    'Fencewall',
    'Other'
  ]

  const fields = [
    { 
      name: 'buildingType', 
      label: 'Structure', 
      required: true, 
      type: 'select',
      options: structureOptions,
      placeholder: 'Select structure type',
      allowCustom: true
    },
    { name: 'category', label: 'Design', required: true, placeholder: 'e.g., Housing, Business, Healthcare' },
    { name: 'code', label: 'Code', required: false, placeholder: 'Optional code (e.g., BT-001)' }
  ]

  const handleSave = async (buildingTypeData, id = null) => {
    try {
      setError(null)
      
      const url = '/api/building-types'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...buildingTypeData }
        : buildingTypeData

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
        await fetchBuildingTypes()
        return data.buildingType
      } else {
        setError(data.error || 'Failed to save building type')
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
      
      const response = await fetch(`/api/building-types?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchBuildingTypes()
      } else {
        setError(data.error || 'Failed to delete building type')
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
        <div className="text-lg">Loading Structure...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchBuildingTypes}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Structures"
      data={buildingTypesData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['buildingType', 'category']}
    />
  )
}

export default BuildingTypesPage
