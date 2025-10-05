'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { 
  FiFileText, 
  FiClipboard, 
  FiCheckSquare, 
  FiChevronDown,
  FiUser,
  FiUsers,
  FiTruck,
  FiBarChart3,
  FiDollarSign,
  FiFile,
  FiShield,
  FiFlag,
  FiCalendar,
  FiMapPin,
  FiSettings,
  FiUpload,
  FiDownload,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiImage
} from 'react-icons/fi'

const ProjectNav = () => {
  const params = useParams()
  const pathname = usePathname()
  const { slug } = params
  const isNewProject = slug === 'addNewProject'

  const [expandedMenus, setExpandedMenus] = useState({
    preContract: false,
    postContract: false,
    consultant: false,
    contractor: false
  })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth()

  const navigationItems = [
    {
      id: 'overview',
      name: 'Project Overview',
      icon: FiFileText,
      path: `/projects/${slug}/overview`
    },
    {
      id: 'summary',
      name: 'Summary',
      icon: FiCalendar,
      path: `/projects/${slug}/summary`
    },
    {
      id: 'gallery',
      name: 'Gallery',
      icon: FiImage,
      path: `/projects/${slug}/gallery`
    },
    {
      id: 'financials',
      name: 'Financials',
      icon: FiDollarSign,
      path: `/projects/${slug}/financials`
    },
    {
      id: 'pre-contract',
      name: 'Pre Contract',
      icon: FiClipboard,
      hasSubMenu: true,
      subItems: [
        { id: 'advert', name: 'Advert in the Media', icon: FiUpload, path: `/projects/${slug}/pre-contract/advert` },
        { id: 'eoi', name: 'Expression of Interest (EOI)', icon: FiFile, path: `/projects/${slug}/pre-contract/eoi` },
        { id: 'rfp', name: 'Request for Proposal', icon: FiFileText, path: `/projects/${slug}/pre-contract/rfp` },
        {
          id: 'tender-documents',
          name: 'Tender Documents',
          icon: FiFile,
          hasSubMenu: true,
          subItems: [
            { id: 'conceptual', name: 'Conceptual and ArcViz', icon: FiFileText, path: `/projects/${slug}/pre-contract/tender-documents/conceptual` },
            { id: 'specification', name: 'Specification and General Work Schedule', icon: FiFileText, path: `/projects/${slug}/pre-contract/tender-documents/specification` },
            { id: 'bill-of-quantities', name: 'Bill of Quantities', icon: FiFileText, path: `/projects/${slug}/pre-contract/tender-documents/bill-of-quantities` }
          ]
        },
        { id: 'structural-designs', name: 'Structural Designs', icon: FiFileText, path: `/projects/${slug}/pre-contract/structural-designs` },
        { id: 'meep', name: 'MEEP', icon: FiFileText, path: `/projects/${slug}/pre-contract/meep` },
        {
          id: 'contract-documents',
          name: 'Contract Documents',
          icon: FiFileText,
          hasSubMenu: true,
          subItems: [
            { id: 'award-letter', name: 'Award Letter', icon: FiFileText, path: `/projects/${slug}/pre-contract/contract-documents/award-letter` },
            { id: 'acceptance-letter', name: 'Acceptance Letter', icon: FiFileText, path: `/projects/${slug}/pre-contract/contract-documents/acceptance-letter` },
            { id: 'signing', name: 'Signing of Contract Documents', icon: FiFileText, path: `/projects/${slug}/pre-contract/contract-documents/signing` }
          ]
        }
      ]
    },
    {
      id: 'post-contract',
      name: 'Post Contract',
      icon: FiCheckSquare,
      hasSubMenu: true,
      subItems: [
        {
          id: 'consultant',
          name: 'Consultant',
          icon: FiUser,
          hasSubMenu: true,
          subItems: [
            { id: 'inception', name: 'Inception Report', icon: FiFile, path: `/projects/${slug}/post-contract/consultant/inception` },
            { id: 'progress-reports', name: 'Progress Reports', icon: FiBarChart3, path: `/projects/${slug}/post-contract/consultant/progress-reports` },
         { id: 'site-meeting-minutes', name: 'Site Meeting Minutes', icon: FiFileText, path: `/projects/${slug}/post-contract/consultant/site-meeting-minutes` },
            { id: 'invoice-claims', name: "Consultant's Invoice / Fee Claims", icon: FiDollarSign, path: `/projects/${slug}/post-contract/consultant/invoice-claims` },
            { id: 'handing-over', name: 'Handing Over', icon: FiFlag, path: `/projects/${slug}/post-contract/consultant/handing-over` },
            { id: 'defect-liability', name: 'Defect Liability', icon: FiShield, path: `/projects/${slug}/post-contract/consultant/defect-liability` },
            { id: 'final-account', name: 'Final Account', icon: FiFile, path: `/projects/${slug}/post-contract/consultant/final-account` }
          ]
        },
        {
          id: 'contractor',
          name: 'Contractor',
          icon: FiUsers,
          hasSubMenu: true,
          subItems: [
            { id: 'mobilization', name: 'Mobilization to Sites', icon: FiTruck, path: `/projects/${slug}/post-contract/contractor/mobilization` },
            { id: 'progress-reports', name: 'Progress Reports', icon: FiBarChart3, path: `/projects/${slug}/post-contract/contractor/progress-reports` },
            { id: 'site-meeting-minutes', name: 'Site Meeting Minutes', icon: FiFileText, path: `/projects/${slug}/post-contract/contractor/site-meeting-minutes` },
            { id: 'ipcs', name: 'Contractor IPCs', icon: FiDollarSign, path: `/projects/${slug}/post-contract/contractor/ipcs` },
            { id: 'handing-over', name: 'Handing Over', icon: FiFlag, path: `/projects/${slug}/post-contract/contractor/handing-over` },
            { id: 'defect-liability', name: 'Defect Liability Period', icon: FiShield, path: `/projects/${slug}/post-contract/contractor/defect-liability` },
            { id: 'final-account', name: 'Final Account', icon: FiFile, path: `/projects/${slug}/post-contract/contractor/final-account` }
          ]
        }
      ]
    }
  ]

  // Apply visibility rules
  const canSeeFinance = user?.userRole === 'admin' || user?.userRole === 'finance'
  let visibleNavigationItems = isNewProject
    ? navigationItems.filter(item => item.id === 'overview')
    : navigationItems
  
  // Hide financials if user doesn't have finance access
  if (!canSeeFinance) {
    visibleNavigationItems = visibleNavigationItems.filter(item => item.id !== 'financials')
  }

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }))
  }

  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu clicked, current state:', isMenuOpen)
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path) => pathname === path

  const renderSubItems = (subItems, parentId = null) => {
    return subItems.map((item) => (
      <div key={item.id}>
        {item.hasSubMenu ? (
          <div>
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                isActive(item.path) || item.subItems?.some(subItem => isActive(subItem.path))
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {item.icon && <item.icon className="text-lg" />}
                <span>{item.name}</span>
              </div>
              <FiChevronDown className={`transform transition-transform ${expandedMenus[item.id] ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus[item.id] && (
              <div className="ml-4 border-l border-gray-200 dark:border-gray-600">
                {renderSubItems(item.subItems, item.id)}
              </div>
            )}
          </div>
        ) : (
          <Link
            href={item.path}
            className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-r-2 border-blue-500'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {item.icon && <item.icon className="text-lg" />}
            <span>{item.name}</span>
          </Link>
        )}
      </div>
    ))
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-20 right-4 z-[60]">
        <button
          onClick={toggleMobileMenu}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`w-full md:w-xs lg:w-sm bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen overflow-y-auto transition-transform duration-300 ${
        isMenuOpen 
          ? 'fixed top-0 left-0 z-[50] transform translate-x-0' 
          : 'md:relative md:transform-none fixed top-0 left-0 z-[55] transform -translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FiSettings className="text-xl text-blue-500" />
              <h6 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Navigation
              </h6>
            </div>
            {/* Close button for mobile */}
            {/* <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleMobileMenu()
              }}
              className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative z-10"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button> */}
          </div>
          
          <nav className="space-y-1">
            {visibleNavigationItems.map((item) => (
              <div key={item.id}>
                {item.hasSubMenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                        isActive(item.path) || item.subItems?.some(subItem => isActive(subItem.path))
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {item.icon && <item.icon className="text-lg" />}
                        <span>{item.name}</span>
                      </div>
                      <FiChevronDown className={`transform transition-transform ${expandedMenus[item.id] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedMenus[item.id] && (
                      <div className="ml-4 border-l border-gray-200 dark:border-gray-600 mt-1">
                        {renderSubItems(item.subItems, item.id)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)} // Close mobile menu when navigating
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon && <item.icon className="text-lg" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

export default ProjectNav 