'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const ContentManagementPage = () => {
  const router = useRouter()

  // Redirect to Building Types by default
  useEffect(() => {
    router.push('/contentManagement/building-types')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to Building Types...</p>
      </div>
    </div>
  )
}

export default ContentManagementPage
