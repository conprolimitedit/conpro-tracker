'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ClientsPage = () => {
  const [clientsData, setClientsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch clients from database
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (data.success) {
        setClientsData(data.clients || [])
      } else {
        setError(data.error || 'Failed to fetch clients')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const fields = [
    { name: 'clientName', label: 'Client Name', required: true, placeholder: 'Enter client name' },
    { name: 'clientType', label: 'Client Type', required: true, placeholder: 'e.g., Government, Private Sector' }
  ]

  const handleSave = async (client, id = null) => {
    try {
      setError(null)
      
      const url = '/api/clients'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...client }
        : client

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
        await fetchClients()
        return data.client
      } else {
        setError(data.error || 'Failed to save client')
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
      
      const response = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchClients()
      } else {
        setError(data.error || 'Failed to delete client')
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
        <div className="text-lg">Loading clients...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchClients}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Clients"
      data={clientsData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['clientName', 'clientType']}
    />
  )
}

export default ClientsPage
