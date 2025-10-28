'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FiSearch } from 'react-icons/fi'

const StructureSearchDropdown = ({ value, onSelect, placeholder = 'Search by structure type, shape (category), or code...' }) => {
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
      if (!debounced || debounced.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '10', search: debounced })
        const res = await fetch(`/api/building-types?${params.toString()}`)
        const data = await res.json()
        const list = (data.buildingTypes || []).slice(0, 10)
        setResults(list)
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

  const handleSelect = useCallback((bt) => {
    const parts = []
    if (bt.buildingType) parts.push(bt.buildingType)
    if (bt.category) parts.push(bt.category)
    if (bt.code) parts.push(bt.code)
    const label = parts.join(' - ') || bt.name || 'Structure'
    setTerm(label)
    onSelect({ id: bt.id, label, buildingType: bt.buildingType, category: bt.category, code: bt.code })
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
      {open && term.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          ) : (
            results.map((bt) => (
              <div
                key={bt.id}
                onClick={() => handleSelect(bt)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                  {[bt.buildingType, bt.category, bt.code].filter(Boolean).join(' - ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default StructureSearchDropdown


