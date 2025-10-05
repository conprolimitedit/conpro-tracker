'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import FileUpload from '../../../../components/FileUpload'

const AdvertPage = () => {
  const params = useParams()
  const { slug } = params

  return (
    <FileUpload
      title="Pre Contract"
      subtitle="Advert in the Media"
      phase="advert"
      projectName={slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}
      fileTypes=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
      customFields={[
        { name: 'advert_date', label: 'Advert Date', type: 'date', required: true },
        { name: 'publication_date', label: 'Publication Date', type: 'date', required: true }
      ]}
    />
  )
}

export default AdvertPage 