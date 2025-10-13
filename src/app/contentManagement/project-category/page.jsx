'use client'
import React, { useState, useEffect } from 'react'
import ContentCRUD from '../../components/ContentCRUD'

const ProjectCategoryPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const limit = 10

  const fetchCategories = async (reset = true) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/project-category?page=${reset ? 1 : page}&limit=${limit}`)
      const data = await response.json()
      if (data.success) {
        const list = data.projectCategories || []
        setCategories(reset ? list : [...categories, ...list])
        if (!reset) setPage(prev => prev + 1)
      } else {
        setError(data.error || 'Failed to fetch project categories')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories(true)
  }, [])

  const fields = [
    { name: 'category', label: 'Category', required: true, placeholder: 'Enter category name' },
    { name: 'description', label: 'Description', required: false, type: 'textarea', placeholder: 'Enter description (optional)' }
  ]

  const handleSave = async (payload, id = null) => {
    try {
      setError(null)
      const url = '/api/project-category'
      const method = id ? 'PUT' : 'POST'
      const body = id ? { id, ...payload } : payload
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (response.status === 409) {
        return { duplicate: true, message: data.error }
      }
      if (data.success) {
        await fetchCategories(true)
        return data.projectCategory
      } else {
        setError(data.error || 'Failed to save project category')
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
      const response = await fetch(`/api/project-category?id=${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        await fetchCategories(true)
      } else {
        setError(data.error || 'Failed to delete project category')
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Network error: ' + err.message)
      throw err
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading project categories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {error}
        <button onClick={() => fetchCategories(true)} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <>
      <ContentCRUD
        title="Project Categories"
        data={categories}
        fields={fields}
        onSave={handleSave}
        onDelete={handleDelete}
        searchFields={['category', 'description']}
      />
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => fetchCategories(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Load More
        </button>
      </div>
    </>
  )
}

export default ProjectCategoryPage


