'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../../components/FileUpload'

const InceptionReportPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Post Contract - Consultant"
      subtitle="Inception Report"
      phase="consultant-inception"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
      customFields={[
        { name: 'inception_date', label: 'Inception Date', type: 'date', required: true },
        { 
          name: 'inception_status', 
          label: 'Inception Status', 
          type: 'select', 
          placeholder: 'Select inception status',
          options: [
            { value: 'not-started', label: 'Not Started' },
            { value: 'draft', label: 'Draft' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'under-review', label: 'Under Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'completed', label: 'Completed' },
            { value: 'rejected', label: 'Rejected' }
          ], 
          required: true 
        }
      ]}
    />
  )
}

export default InceptionReportPage