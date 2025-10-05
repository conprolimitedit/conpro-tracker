'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '@/app/components/FileUpload'

const MEEPPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload 
      title="MEEP (Mechanical, Electrical, Electronic, and Plumbing)"
      phase="meep"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
      showSpecialComments={false}
      allowedRoles={['admin', 'meep']}
    />
  )
}

export default MEEPPage
