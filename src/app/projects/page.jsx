'use client'
import { Suspense } from 'react'
import ProjectDashboardFixed from '../components/Dashboard/ProjectDashboardFixed.jsx'
import ProjectDataSummary from '../components/Projects/ProjectDataSummary.jsx'

const ProjectsPage = () => {
  return (
    <>
      {/* Project Data Summary at the top */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <ProjectDataSummary />
      </div>
      <Suspense fallback={<div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading projects...</div>}>
        <ProjectDashboardFixed/>
      </Suspense>
      </>
  )
}

export default ProjectsPage

