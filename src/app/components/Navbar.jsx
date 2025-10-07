'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import SearchBar from './SearchBar'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContentDropdownOpen, setIsContentDropdownOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const isActive = (path) => pathname === path

  const contentManagementItems = [
    { name: 'Contractors', href: '/contentManagement/contractors' },
    { name: 'Clients', href: '/contentManagement/clients' },
    { name: 'Funding Agencies', href: '/contentManagement/funding-agencies' },
    { name: 'Building Types', href: '/contentManagement/building-types' },
    { name: 'Services', href: '/contentManagement/services' },
    { name: 'Clerk of Works', href: '/contentManagement/clerk-of-works' },
    { name: 'Project Types', href: '/contentManagement/project-types' },
    { name: 'Finance Document ', href: '/contentManagement/finance-documents' }
  ]

  const canSeeFinance = user?.userRole === 'admin' || user?.userRole === 'finance'
  const canSeeContentManagement = user?.userRole === 'admin' || user?.userRole === 'projectManager'
  const visibleContentItems = canSeeFinance
    ? contentManagementItems
    : contentManagementItems.filter(item => item.href !== '/contentManagement/finance-documents')

  const displayRole = user?.userRole ? user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1) : ''

  const handleSearch = (searchTerm) => {
    // Handle search functionality
    console.log('Searching for:', searchTerm)
    // You can implement your search logic here
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    setIsContentDropdownOpen(false)
    setIsSearchOpen(false)
    router.push('/')
  }

  // Do not render on home or login routes
  if (pathname === '/' || pathname === '/login') {
    return null
  }

  return (
    <>
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/projects" className="flex items-center space-x-2">
              <Image src="/Logo.jpeg" alt="Conpro Tracker Logo" width={200} height={200} className="rounded-lg object-cover" />
              <span className="text-sm font-bold text-[#29166F]">Conpro Tracker</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Projects */}
            <Link 
              href="/projects" 
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                isActive('/projects') 
                  ? 'bg-[#29166F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
              }`}
            >
              Projects
            </Link>

            {/* Add New Project - Only for admin/projectManager */}
            {canSeeContentManagement && (
              <Link 
                href="/projects/addNewProject" 
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isActive('/projects/addNewProject') 
                    ? 'bg-[#29166F] text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                }`}
              >
                Add New Project
              </Link>
            )}

            {/* Users - Only visible to admin */}
            {user?.userRole === 'admin' && (
              <Link 
                href="/users" 
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isActive('/users') 
                    ? 'bg-[#29166F] text-white' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                }`}
              >
                Users
              </Link>
            )}

            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center space-x-1 ${
                isSearchOpen 
                  ? 'bg-[#29166F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>

            {/* Content Management Dropdown - Only for admin/projectManager */}
            {canSeeContentManagement && (
              <div 
                className="relative"
              >
                <button
                  onClick={() => setIsContentDropdownOpen(!isContentDropdownOpen)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center space-x-1 ${
                    pathname.startsWith('/contentManagement') 
                      ? 'bg-[#29166F] text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                  }`}
                >
                  <span>Content Management</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isContentDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isContentDropdownOpen && (
                  <div 
                    onMouseLeave={() => setIsContentDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {visibleContentItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2 text-xs transition-colors duration-200 ${
                          isActive(item.href)
                            ? 'bg-[#29166F] text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                        }`}
                        onClick={() => setIsContentDropdownOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>



          {/* User Section - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Welcome Message */}
            <div className="text-xs text-gray-700">
              <span className="font-medium">Welcome,</span>
              <span className="ml-1 text-[#29166F] font-semibold">{displayRole || 'User'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-[#29166F] transition-colors duration-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#29166F] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#29166F]"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* Welcome Message - Mobile */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-700">
                <span className="font-medium">Welcome,</span>
                <span className="ml-1 text-[#29166F] font-semibold">{displayRole || 'User'}</span>
              </div>
            </div>

            {/* Projects */}
            <Link
              href="/projects"
              className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                isActive('/projects')
                  ? 'bg-[#29166F] text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Projects
            </Link>

            {/* Add New Project - Only for admin/projectManager */}
            {canSeeContentManagement && (
              <Link
                href="/projects/addNewProject"
                className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isActive('/projects/addNewProject')
                    ? 'bg-[#29166F] text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Add New Project
              </Link>
            )}

            {/* Users - Only visible to admin */}
            {user?.userRole === 'admin' && (
              <Link
                href="/users"
                className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isActive('/users')
                    ? 'bg-[#29166F] text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Users
              </Link>
            )}

            {/* Search - Mobile */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center justify-between ${
                isSearchOpen
                  ? 'bg-[#29166F] text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isSearchOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Search Bar - Mobile (Conditional) */}
            {isSearchOpen && (
              <div className="px-3 py-2">
                <SearchBar onSearch={handleSearch} placeholder="Search..." />
              </div>
            )}

            {/* Content Management Mobile - Only for admin/projectManager */}
            {canSeeContentManagement && (
              <div>
                <button
                  onClick={() => setIsContentDropdownOpen(!isContentDropdownOpen)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center justify-between ${
                    pathname.startsWith('/contentManagement')
                      ? 'bg-[#29166F] text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#29166F]'
                  }`}
                >
                  <span>Content Management</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isContentDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile Dropdown */}
                {isContentDropdownOpen && (
                  <div className="pl-4 space-y-1">
                    {visibleContentItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2 rounded-md text-xs transition-colors duration-200 ${
                          isActive(item.href)
                            ? 'bg-[#29166F] text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-[#29166F]'
                        }`}
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsContentDropdownOpen(false)
                        }}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Logout Button - Mobile */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  handleLogout()
                  setIsMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-[#29166F] transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar - Below Navbar */}
      {isSearchOpen && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <SearchBar onSearch={handleSearch} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
    {/* Global Toasts for authenticated pages (kept at bottom) */}
    <ToastContainer position="bottom-right" autoClose={3000} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </>
  )
}

export default Navbar
