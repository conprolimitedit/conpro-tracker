'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '@/app/components/FileUpload'

const BillOfQuantitiesPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload 
      title="Bill of Quantities"
      phase="bill-of-quantities"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.jpg,.png"
      maxFileSize="10MB"
    />
  )
}

export default BillOfQuantitiesPage;
