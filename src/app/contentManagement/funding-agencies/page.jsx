'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const FundingAgenciesPage = () => {
  const [fundingAgenciesData, setFundingAgenciesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch funding agencies from database
  const fetchFundingAgencies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/funding-agencies')
      const data = await response.json()
      
      if (data.success) {
        setFundingAgenciesData(data.fundingAgencies || [])
      } else {
        setError(data.error || 'Failed to fetch funding agencies')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFundingAgencies()
  }, [])

  const fields = [
    { name: 'agencyName', label: 'Agency Name', required: true, placeholder: 'Enter funding agency name' },
    { name: 'agencyType', label: 'Agency Type', required: true, placeholder: 'e.g., International Financial Institution, Development Bank' }
  ]

  const handleSave = async (agency, id = null) => {
    try {
      setError(null)
      
      const url = '/api/funding-agencies'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...agency }
        : agency

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
        await fetchFundingAgencies()
        return data.fundingAgency
      } else {
        setError(data.error || 'Failed to save funding agency')
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
      
      const response = await fetch(`/api/funding-agencies?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchFundingAgencies()
      } else {
        setError(data.error || 'Failed to delete funding agency')
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
        <div className="text-lg">Loading funding agencies...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchFundingAgencies}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Funding Agencies"
      data={fundingAgenciesData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['agencyName', 'agencyType']}
    />
  )
}

export default FundingAgenciesPage
