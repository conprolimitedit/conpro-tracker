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
      <Suspense fallback={
        <div className="min-h-[50vh] bg-gray-50 dark:bg-gray-900 p-6">
          <div className="h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse mb-4" />
          <div className="h-[60vh] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      }>
        <ProjectDashboardFixed/>
      </Suspense>
      </>
  )
}

export default ProjectsPage

