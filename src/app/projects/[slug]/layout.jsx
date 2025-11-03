'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import ProjectNav from '../../components/ProjectNav'
import UserHeader from '../../components/UserHeader'
const ProjectLayout = ({ children }) => {
  const pathname = usePathname()
  const isPreviewRoute = pathname?.includes('/preview')
  
  return (
    <div className="flex  gap-4 bg-gray-50 dark:bg-gray-900">
      {/* Navigation Sidebar - Hidden on preview route */}
      {!isPreviewRoute && <ProjectNav />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
      <UserHeader />
      <br/>
        {children}
      </div>
    </div>
  )
}

export default ProjectLayout 