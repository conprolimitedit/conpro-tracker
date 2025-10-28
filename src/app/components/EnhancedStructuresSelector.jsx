'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FiChevronDown, FiX, FiSearch, FiPlus } from 'react-icons/fi'
import { toast } from 'react-toastify'

const EnhancedStructuresSelector = ({
  selectedItems = [],
  onSelectionChange,
  placeholder = 'Select structures...',
  searchPlaceholder = 'Search structures...'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStructure, setNewStructure] = useState({ buildingType: '', category: '', code: '' })
  const [isSaving, setIsSaving] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch initial 15 items
  useEffect(() => {
    fetchBuildingTypes('', 15)
  }, [])

  // Fetch building types with search and limit
  const fetchBuildingTypes = async (search = '', limit = 15) => {
    try {
      setLoading(true)
      const url = `/api/building-types?limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setOptions(data.buildingTypes || [])
      }
    } catch (error) {
      console.error('Error fetching building types:', error)
      toast.error('Failed to load structures')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBuildingTypes(searchTerm, 50) // Fetch up to 50 results when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Helper function to get display name
  const getDisplayName = (option) => {
    return option.buildingType || option.name || 'Unknown'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options to exclude selected items
  const filteredOptions = options.filter(option => 
    !selectedItems.some(selected => selected && selected.id === option.id)
  )

  const handleSelect = (option) => {
    const newSelection = [...selectedItems, option]
    onSelectionChange(newSelection)
    setSearchTerm('')
  }

  const handleRemove = (itemId) => {
    const newSelection = selectedItems.filter(item => item && item.id !== itemId)
    onSelectionChange(newSelection)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
    }
  }

  // Handle add new structure
  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsOpen(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setNewStructure({ buildingType: '', category: '', code: '' })
  }

  const handleAddNew = async () => {
    if (!newStructure.buildingType || !newStructure.category) {
      toast.error('Building Type and Shape are required')
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch('/api/building-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingType: newStructure.buildingType,
          category: newStructure.category,
          code: newStructure.code || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Structure added successfully!')
        
        // Add the new structure to selected items
        const newSelection = [...selectedItems, data.buildingType]
        onSelectionChange(newSelection)
        
        // Refresh options list
        await fetchBuildingTypes('', 15)
        
        handleCloseModal()
      } else {
        toast.error(data.error || 'Failed to add structure')
      }
    } catch (error) {
      console.error('Error adding structure:', error)
      toast.error('Failed to add structure')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Selected Items Display */}
        <div
          onClick={toggleDropdown}
          className="min-h-[42px] p-2 border border-gray-300 rounded-lg cursor-pointer transition-colors bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <div className="flex flex-wrap gap-1">
            {selectedItems.filter(item => item).length > 0 ? (
              selectedItems.filter(item => item).map((item, index) => (
                <span
                  key={item.id || `item-${index}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                >
                  <span className="truncate max-w-[150px]">{getDisplayName(item)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(item.id)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <FiChevronDown 
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform ${
              isOpen ? 'rotate-180' : ''
            } text-gray-400`} 
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-[200px] overflow-y-auto">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : filteredOptions.length > 0 ? (
                <>
                  {filteredOptions.map((option, index) => (
                    <button
                      key={option.id || `option-${index}`}
                      onClick={() => handleSelect(option)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getDisplayName(option)}
                      </div>
                      {option.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.category}
                        </div>
                      )}
                    </button>
                  ))}
                  {/* Add New option */}
                  <button
                    onClick={handleOpenModal}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-200 dark:border-gray-600 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add New Structure
                  </button>
                </>
              ) : (
                <div className="px-3 py-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {searchTerm ? 'No matching options found' : 'No options available'}
                  </div>
                  <button
                    onClick={handleOpenModal}
                    className="w-full text-left px-2 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded border border-dashed border-blue-300 dark:border-blue-600 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add New Structure
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add New Structure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Structure
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Structure Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStructure.buildingType}
                  onChange={(e) => setNewStructure({ ...newStructure, buildingType: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select structure type</option>
                  <option value="Dormitory">Dormitory</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Lecture Block">Lecture Block</option>
                  <option value="Administration">Administration</option>
                  <option value="Library">Library</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Multi-purpose Hall">Multi-purpose Hall</option>
                  <option value="Dining Hall">Dining Hall</option>
                  <option value="Staff Flat">Staff Flat</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Sick Bay">Sick Bay</option>
                  <option value="Lavatories">Lavatories</option>
                  <option value="Park">Park</option>
                  <option value="Fencewall">Fencewall</option>
                  <option value="Other">Other</option>
                </select>
                {newStructure.buildingType === 'Other' && (
                  <input
                    type="text"
                    value={newStructure.buildingType}
                    onChange={(e) => setNewStructure({ ...newStructure, buildingType: e.target.value })}
                    placeholder="Enter custom structure type"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shape <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStructure.category}
                  onChange={(e) => setNewStructure({ ...newStructure, category: e.target.value })}
                  required
                  placeholder="e.g., Straight, L-Shape, Courtyard"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code (Optional)
                </label>
                <input
                  type="text"
                  value={newStructure.code}
                  onChange={(e) => setNewStructure({ ...newStructure, code: e.target.value })}
                  placeholder="e.g., BT-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Adding...' : 'Add Structure'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EnhancedStructuresSelector

