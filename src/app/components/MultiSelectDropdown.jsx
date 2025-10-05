'use client'
import React, { useState, useRef, useEffect } from 'react'
import { FiChevronDown, FiX, FiSearch } from 'react-icons/fi'

const MultiSelectDropdown = ({
  options = [],
  selectedItems = [],
  onSelectionChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  maxHeight = '200px',
  disabled = false,
  nameField = 'name', // Allow custom name field
  idField = 'id' // Allow custom ID field
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Helper function to get display name from option
  const getDisplayName = (option) => {
    return option[nameField] || 
           option.name || 
           option.clientName || 
           option.fullName || 
           option.managerName || 
           option.buildingType || 
           option.serviceName || 
           option.agencyName || 
           option.projectType ||
           'Unknown'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const optionName = getDisplayName(option)
    return optionName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedItems.some(selected => selected && selected[idField] === option[idField])
  })

  const handleSelect = (option) => {
    const newSelection = [...selectedItems, option]
    onSelectionChange(newSelection)
    setSearchTerm('')
  }

  const handleRemove = (itemId) => {
    const newSelection = selectedItems.filter(item => item && item[idField] !== itemId)
    onSelectionChange(newSelection)
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchTerm('')
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Items Display */}
      <div
        onClick={toggleDropdown}
        className={`min-h-[42px] p-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200'
        } dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
      >
        <div className="flex flex-wrap gap-1">
          {selectedItems.filter(item => item).length > 0 ? (
            selectedItems.filter(item => item).map((item, index) => (
              <span
                key={item[idField] || item.id || item.name || item.clientName || item.fullName || item.managerName || item.buildingType || item.serviceName || item.agencyName || item.projectType || `item-${index}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
              >
                <span className="truncate max-w-[150px]">{getDisplayName(item)}</span>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(item[idField])
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                )}
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
      {isOpen && !disabled && (
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
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option[idField] || option.id || option.name || option.clientName || option.fullName || option.managerName || option.buildingType || option.serviceName || option.agencyName || option.projectType || `option-${index}`}
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
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No matching options' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelectDropdown 