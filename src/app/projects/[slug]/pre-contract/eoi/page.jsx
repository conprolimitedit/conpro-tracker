'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../components/FileUpload'

const EOIPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Pre Contract"
      subtitle="Expression of Interest (EOI)"
      phase="eoi"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
    />
  )
}

export default EOIPage