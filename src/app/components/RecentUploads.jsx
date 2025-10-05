import React from 'react'
import { FiFileText, FiFolder } from 'react-icons/fi'

// Simple demo data for recent uploads
const recentUploads = [
  { id: 1, fileName: 'Inception_Report.pdf', projectName: 'Korle Bu Teaching Hospital Extension', phase: 'Post Contract – Consultant' },
  { id: 2, fileName: 'Progress_Report_12.pdf', projectName: 'Accra Metropolitan Road Network', phase: 'Post Contract – Contractor' },
  { id: 3, fileName: 'Tender_Documents.zip', projectName: 'Ecobank Ghana Headquarters', phase: 'Pre Contract' },
  { id: 4, fileName: 'Invoice_Claim_04.pdf', projectName: 'Tamale International Airport Expansion', phase: 'Post Contract – Consultant' },
  { id: 5, fileName: 'Final_Account.xlsx', projectName: 'University of Ghana Library Complex', phase: 'Post Contract – Contractor' },
]

const getPhaseClasses = (phase) => {
  const lower = String(phase).toLowerCase()
  if (lower.includes('pre contract')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
  if (lower.includes('consultant')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
  if (lower.includes('contractor')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
}

const RecentUploads = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Uploads</h3>
      </div>

      <div className="divide-y divide-gray-200 w-full dark:divide-gray-700">
        {recentUploads.map((item) => (
          <div key={item.id} className="py-3 flex flex-col  items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="shrink-0 h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <FiFileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-gray-900 dark:text-gray-100 font-medium truncate">{item.fileName}</div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1 truncate">
                  <FiFolder className="h-3.5 w-3.5" />
                  <span className="truncate">{item.projectName}</span>
                </div>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded-full whitespace-nowrap ${getPhaseClasses(item.phase)}`}>
              {item.phase}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentUploads
