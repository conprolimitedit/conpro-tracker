'use client'
import React from 'react'
import FileUpload from '../../../../components/FileUpload'

const ContractDocumentsPage = () => {
  return (
    <FileUpload
      title="Pre Contract"
      subtitle="Contract Documents"
      apiEndpoint="/api/projects/contract-documents"
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
      maxFileSize="10MB"
    />
  )
}

export default ContractDocumentsPage