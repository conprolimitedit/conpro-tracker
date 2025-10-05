'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '@/app/components/FileUpload'

const StructuralDesignsPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload 
      title="Structural Designs"
      phase="structural-designs"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
      showSpecialComments={false}
      allowedRoles={['admin', 'structural']}
    />
  )
}

export default StructuralDesignsPage
