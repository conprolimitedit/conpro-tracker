'use client'
import React from 'react'
import ProjectNav from '../../components/ProjectNav'
import UserHeader from '../../components/UserHeader'
const ProjectLayout = ({ children }) => {
  return (
    <div className="flex  gap-4 bg-gray-50 dark:bg-gray-900">
      {/* Navigation Sidebar */}
      <ProjectNav />
      
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