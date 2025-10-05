'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiArrowLeft, FiHome } from 'react-icons/fi'
import ContentSidebar from '../components/ContentSidebar'

const ContentLayout = ({ children }) => {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    const path = pathname.split('/')
    if (path[2] === 'contractors') return 'Contractors Management'
    if (path[2] === 'clients') return 'Clients Management'
    if (path[2] === 'funding-agencies') return 'Funding Agencies Management'
    if (path[2] === 'building-types') return 'Building Types Management'
    if (path[2] === 'services') return 'Services Management'
    if (path[2] === 'clerk-of-works') return 'Clerk of Works Management'
    return 'Content Management'
  }

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      {/* <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FiHome className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="text-gray-400 dark:text-gray-600">/</div>
              <span className="text-gray-900 dark:text-white font-medium">
                Content Management
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Page:</span>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getPageTitle()}
                </div>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <ContentSidebar />
        
        {/* Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default ContentLayout
