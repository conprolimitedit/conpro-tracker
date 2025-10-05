'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '@/app/components/FileUpload'

const SigningPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload 
      title="Signing of Contract Documents"
      phase="signing"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.jpg,.png"
      maxFileSize="10MB"
    />
  )
}

export default SigningPage;
