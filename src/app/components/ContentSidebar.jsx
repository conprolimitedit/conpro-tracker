'use client'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiBuilding, 
  FiUsers, 
  FiDollarSign, 
  FiSettings, 
  FiUserCheck,
  FiGrid,
  FiArrowLeft,
  FiFileText,
  FiMenu,
  FiX
} from 'react-icons/fi'

// Alternative import method
import * as FiIcons from 'react-icons/fi'

import Link from 'next/link'

const ContentSidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const contentItems = [
    {
      id: 'building-types',
      name: 'Building Types',
      icon: FiHome || FiIcons.FiHome || '🏠',
      path: '/contentManagement/building-types',
      description: 'Manage building classifications (Default)'
    },
    {
      id: 'clients',
      name: 'Clients',
      icon: FiUsers || FiIcons.FiUsers || '👥',
      path: '/contentManagement/clients',
      description: 'Manage client organizations'
    },
    {
      id: 'contractors',
      name: 'Contractors',
      icon: FiBuilding || FiIcons.FiBuilding || '🏗️',
      path: '/contentManagement/contractors',
      description: 'Manage construction contractors'
    },
    {
      id: 'funding-agencies',
      name: 'Funding Agencies',
      icon: FiDollarSign || FiIcons.FiDollarSign || '💰',
      path: '/contentManagement/funding-agencies',
      description: 'Manage funding institutions'
    },
    {
      id: 'services',
      name: 'Services',
      icon: FiSettings || FiIcons.FiSettings || '⚙️',
      path: '/contentManagement/services',
      description: 'Manage project services'
    },
    {
      id: 'clerk-of-works',
      name: 'Clerk of Works',
      icon: FiUserCheck || FiIcons.FiUserCheck || '👷',
      path: '/contentManagement/clerk-of-works',
      description: 'Manage clerk of works'
    },
    {
      id: 'project-managers',
      name: 'Project Managers',
      icon: FiUsers || FiIcons.FiUsers || '👨‍💼',
      path: '/contentManagement/project-managers',
      description: 'Manage project managers'
    },
    {
      id: 'project-coordinators',
      name: 'Project Coordinators',
      icon: FiUsers || FiIcons.FiUsers || '👩‍💼',
      path: '/contentManagement/project-coordinators',
      description: 'Manage project coordinators'
    },
    {
      id: 'project-types',
      name: 'Project Types',
      icon: FiGrid || FiIcons.FiGrid || '📊',
      path: '/contentManagement/project-types',
      description: 'Manage project classifications'
    },
    {
      id: 'finance-documents',
      name: 'Finance Documents',
      icon: FiFileText || FiIcons.FiFileText || '📄',
      path: '/contentManagement/finance-documents',
      description: 'Manage financial document types'
    }
  ]



  const isActive = (path) => pathname === path

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
        >
          {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 md:w-sm bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-screen sticky top-0 z-30
        ${isOpen ? 'fixed inset-y-0 left-0' : 'hidden md:flex'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your content types</p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 md:p-4 space-y-1 md:space-y-2 flex-1">
          {contentItems.map((item) => {
            const Icon = item.icon
            
            return (
              <Link
                key={item.id}
                href={item.path}
                title={item.name}
                onClick={() => setIsOpen(false)} // Close mobile menu when navigating
                className={`group flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : item.id === 'building-types'
                    ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                    : item.id === 'building-types'
                    ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }`}>
                  {Icon && typeof Icon === 'function' ? (
                    <Icon className="w-5 h-5" />
                  ) : typeof Icon === 'string' ? (
                    <span className="text-lg">{Icon}</span>
                  ) : (
                    <div className="w-5 h-5 bg-gray-400 rounded"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    {item.id === 'building-types' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Default
                      </span>
                    )}
                  </div>
                  <div className={`text-xs truncate ${
                    isActive(item.path)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Content Management System
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Version 1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ContentSidebar
