'use client'
// import ProjectDashboard from '../components//ProjectDashboard.jsx'

import ProjectDashboardFixed from '../components/Dashboard/ProjectDashboardFixed.jsx'
import ProjectDataSummary from '../components/Projects/ProjectDataSummary.jsx'
const ProjectsPage = () => {
  return (
    <>
    {/* Project Data Summary at the top */}
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <ProjectDataSummary />
  </div>
  <ProjectDashboardFixed />
  </>
  )
}

export default ProjectsPage
