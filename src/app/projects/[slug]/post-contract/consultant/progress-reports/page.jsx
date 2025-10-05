'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../../components/FileUpload'

const ProgressReportsPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Post Contract - Consultant"
      subtitle="Progress Reports"
      phase="consultant-progress-reports"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls"
      maxFileSize="10MB"
    />
  )
}

export default ProgressReportsPage