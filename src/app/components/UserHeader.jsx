'use client'
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const UserHeader = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { user, getDisplayName, getInitials, isActive } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    // Add search functionality here
    console.log('Searching for:', searchQuery)
  }

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100'
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100'
      case 'finance':
        return 'text-green-600 bg-green-100'
      case 'projectManager':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Welcome Message and User Info */}
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-[#29166F] to-[#1708B7] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {getInitials()}
            </span>
          </div>
          
          <div>
            <p className=" font-bold text-[#29166F]">
              Welcome back
            </p>

            <h1 className="text-2xl font-bold text-[#29166F]">
              {getDisplayName()}!
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.userRole)}`}>
                {user?.userRole}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user?.status)}`}>
                {user?.status}
              </span>
              <span className="text-gray-600 text-sm">
                • Conpro Tracker
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {/* <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects, clients, or anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#29166F] focus:border-[#29166F] transition-all duration-200 placeholder-gray-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-[#29166F] hover:text-[#1708B7] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>
        </div> */}

        {/* Quick Actions */}
      </div>
    </div>
  )
}

export default UserHeader
