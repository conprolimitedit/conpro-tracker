'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentCRUD from '../../components/ContentCRUD'

const FinanceDocumentsPage = () => {
  const router = useRouter()
  const [financeDocumentsData, setFinanceDocumentsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Role guard: only admin and finance
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      const user = stored ? JSON.parse(stored) : null
      const role = user?.role
      if (!role || (role !== 'admin' && role !== 'finance')) {
        router.replace('/dashboard')
        return
      }
    } catch (_) {
      router.replace('/dashboard')
      return
    }
  }, [router])

  // Fetch finance documents from database
  const fetchFinanceDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/finance-documents')
      const data = await response.json()
      
      if (data.success) {
        setFinanceDocumentsData(data.financeDocuments || [])
      } else {
        setError(data.error || 'Failed to fetch finance documents')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceDocuments()
  }, [])

  const fields = [
    { name: 'documentType', label: 'Document Type', required: true, placeholder: 'Enter document type name' },
    { name: 'category', label: 'Category', required: true, placeholder: 'e.g., Billing, Payment, Procurement' },
    { name: 'description', label: 'Description', required: false, type: 'textarea', placeholder: 'Enter document description' }
  ]

  const handleSave = async (document, id = null) => {
    try {
      setError(null)
      
      const url = '/api/finance-documents'
      const method = id ? 'PUT' : 'POST'
      const body = id 
        ? { id, ...document }
        : document

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
        await fetchFinanceDocuments()
        return data.financeDocument
      } else {
        setError(data.error || 'Failed to save finance document')
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
      
      const response = await fetch(`/api/finance-documents?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the data after successful deletion
        await fetchFinanceDocuments()
      } else {
        setError(data.error || 'Failed to delete finance document')
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
        <div className="text-lg">Loading finance documents...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchFinanceDocuments}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <ContentCRUD
      title="Finance Documents"
      data={financeDocumentsData}
      fields={fields}
      onSave={handleSave}
      onDelete={handleDelete}
      searchFields={['documentType', 'category', 'description']}
    />
  )
}

export default FinanceDocumentsPage
