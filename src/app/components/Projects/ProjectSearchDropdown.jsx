'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FiSearch } from 'react-icons/fi'

const ProjectSearchDropdown = ({ value, onSelect, placeholder = 'Search by project or institution...' }) => {
  const [term, setTerm] = useState(value || '')
  const [debounced, setDebounced] = useState(term)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300)
    return () => clearTimeout(id)
  }, [term])

  useEffect(() => {
    const fetchResults = async () => {
      if (!debounced || debounced.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', limit: '10', search: debounced })
        const res = await fetch(`/api/projects?${params.toString()}`)
        const data = await res.json()
        setResults((data.projects || []).slice(0, 10))
      } catch (e) {
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [debounced])

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const handleSelect = useCallback((project) => {
    const selected = project.project_name || project.institution_name
    setTerm(selected)
    onSelect({ type: project.project_name ? 'project_name' : 'institution_name', value: selected })
    setOpen(false)
  }, [onSelect])

  return (
    <div className="relative" ref={ref}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      {open && term.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          ) : (
            results.map((p) => (
              <div
                key={p.project_id}
                onClick={() => handleSelect(p)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{p.project_name}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{p.institution_name}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectSearchDropdown


