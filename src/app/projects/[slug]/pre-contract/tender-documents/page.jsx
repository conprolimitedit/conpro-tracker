'use client'
import React from 'react'
import FileUpload from '../../../../components/FileUpload'

const TenderDocumentsPage = () => {
  return (
    <FileUpload
      title="Pre Contract"
      subtitle="Tender Documents"
      phase="tender-documents"
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
    />
  )
}

export default TenderDocumentsPage