'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../../components/FileUpload'

const InvoiceClaimsPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Post Contract - Consultant"
      subtitle="Invoice / Fee Claims"
      phase="consultant-invoice-claims"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls"
      maxFileSize="10MB"
    />
  )
}

export default InvoiceClaimsPage