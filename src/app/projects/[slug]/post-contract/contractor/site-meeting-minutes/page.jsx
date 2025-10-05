'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../../components/FileUpload'

const ContractorSiteMeetingMinutesPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Post Contract - Contractor"
      subtitle="Site Meeting Minutes"
      phase="contractor-site-meeting-minutes"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls"
      maxFileSize="10MB"
    />
  )
}

export default ContractorSiteMeetingMinutesPage