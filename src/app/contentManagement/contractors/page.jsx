'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import ContentCRUD from '../../components/ContentCRUD'

const ContractorsPage = () => {
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [contractorsData, setContractorsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return
    
    // Role guard: only admin, finance, and project manager
    if (!isAuthenticated()) {
      router.replace('/')
      return
    }
    
    const userRole = user?.userRole
    if (!userRole || (userRole !== 'admin' && userRole !== 'finance' && userRole !== 'projectManager')) {
      router.replace('/')
      return
    }
  }, [router, authLoading, isAuthenticated, user])

  // Fetch contractors from database
  const fetchContractors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/contractors')
      const data = await response.json()
      
      if (data.success) {
        setContractorsData(data.contractors || [])
      } else {
        setError(data.error || 'Failed to fetch contractors')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContractors()
  }, [])

  const fields = [
    { name: 'fullName', label: 'Contractor Name', required: true, placeholder: 'Enter contractor name' },
    { name: 'category', label: 'Category', required: false, placeholder: 'e.g., General Construction, Infrastructure' },
    { name: 'specialization', label: 'Specialization', required: false, placeholder: 'e.g., Large Scale Projects, Road Construction' }
  ]

  const handleSave = async (contractor, id = null) => {
    try {
      setError(null)
      
      const url = '/api/contractors'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...contractor }
        : contractor

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
        await fetchContractors()
        return data.contractor
      } else {
        setError(data.error || 'Failed to save contractor')
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
      
      const response = await fetch(`/api/contractors?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchContractors()
      } else {
        setError(data.error || 'Failed to delete contractor')
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      throw err
    }
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading contractors...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchContractors}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  // Determine if user can perform actions (admin and finance can edit, project manager is read-only)
  const canEdit = user?.userRole === 'admin' || user?.userRole === 'finance'

  return (
    <ContentCRUD
      title="Contractors"
      data={contractorsData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['fullName', 'category', 'specialization']}
      showActions={canEdit}
    />
  )
}

export default ContractorsPage
