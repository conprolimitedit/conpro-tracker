'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../components/FileUpload'

const RFPPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Pre Contract"
      subtitle="Request for Proposal"
      phase="rfp"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
    />
  )
}

export default RFPPage