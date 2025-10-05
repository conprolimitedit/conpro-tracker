'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../../components/FileUpload'

const MobilizationPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Post Contract - Contractor"
      subtitle="Mobilization to Sites"
      phase="contractor-mobilization"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
    />
  )
}

export default MobilizationPage