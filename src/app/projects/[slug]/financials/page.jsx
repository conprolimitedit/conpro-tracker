'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { toast } from 'react-toastify'
import { FiSave, FiUpload, FiFile, FiX, FiDownload, FiEdit3, FiTrash2, FiCheck, FiXCircle, FiRefreshCw } from 'react-icons/fi'
import Link from 'next/link'

export default function FinancialsPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [financials, setFinancials] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [financeDocumentTypes, setFinanceDocumentTypes] = useState([])
  const [formData, setFormData] = useState({
    documentType: '',
    projectPhase: '',
    subMenu: '',
    subSubMenu: '',
    financialAmount: '',
    documentDate: '',
    dueDate: '',
    priority: 'medium',
    specialNotes: '',
    generalComments: ''
  })
  const [files, setFiles] = useState([])
  const [links, setLinks] = useState([])
  const [replacementFile, setReplacementFile] = useState(null) // For file replacement during editing
  const [submitting, setSubmitting] = useState(false)
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [fileToDelete, setFileToDelete] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [fileToReplace, setFileToReplace] = useState(null)
  const [newLink, setNewLink] = useState('')
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [editingLinkName, setEditingLinkName] = useState('')

  // Check if user has access to financials
  useEffect(() => {
    if (user && user.userRole !== 'admin' && user.userRole !== 'finance') {
      router.push('/projects')
    }
  }, [user, router])

  useEffect(() => {
    if (user && (user.userRole === 'admin' || user.userRole === 'finance')) {
      fetchData()
    }
  }, [slug, refreshKey, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFinancials(),
        fetchFinanceDocumentTypes()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFinanceDocumentTypes = async () => {
    try {
      const response = await fetch('/api/finance-documents')
      const data = await response.json()
      if (data.success) {
        setFinanceDocumentTypes(data.financeDocuments)
      }
    } catch (error) {
      console.error('Error fetching finance document types:', error)
    }
  }

  const fetchFinancials = async (page = 1, append = false) => {
    try {
      console.log('🔍 Fetching financials for project:', slug, 'page:', page)
      const response = await fetch(`/api/projects/slug/${slug}/financials?page=${page}&limit=10`)
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Check if response is HTML (404 page)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await response.text()
        console.error('❌ Received HTML instead of JSON:', htmlText.substring(0, 200))
        throw new Error('API endpoint not found - received HTML response')
      }
      
      const data = await response.json()
      console.log('📥 API Response:', data)
      
      if (data.success) {
        if (append) {
          setFinancials(prev => [...prev, ...(data.documents || [])])
        } else {
          setFinancials(data.documents || [])
        }
        setTotalCount(data.total || 0)
        setHasMore(data.hasMore || false)
        setCurrentPage(page)
        console.log('✅ Set financials:', data.documents?.length || 0, 'Total:', data.total)
      } else {
        console.error('❌ API returned error:', data.error)
        toast.error(data.error || 'Failed to fetch financial documents')
        if (!append) {
          setFinancials([])
        }
      }
    } catch (error) {
      console.error('❌ Error fetching financial documents:', error)
      toast.error('Error fetching financial documents')
      if (!append) {
        setFinancials([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    setHasMore(true)
    setRefreshKey(prev => prev + 1)
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    const nextPage = currentPage + 1
    await fetchFinancials(nextPage, true)
  }

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentPage, hasMore, loadingMore])

  const startEditing = (doc) => {
    setEditingId(doc.id)
    setEditFormData({
      documentType: doc.document_type_id || '',
      projectPhase: doc.project_phase || '',
      subMenu: doc.sub_menu || '',
      subSubMenu: doc.sub_sub_menu || '',
      financialAmount: doc.financial_amount || '',
      documentDate: doc.document_date || '',
      dueDate: doc.due_date || '',
      priority: doc.priority || 'medium',
      specialNotes: doc.special_notes || '',
      generalComments: doc.general_comments || '',
      fileComment: doc.file_data?.comment || '',
      // For link editing
      linkUrl: doc.file_data?.file_type === 'link' ? (doc.file_data?.file_link?.link || doc.file_data?.file_name) : '',
      fileName: doc.file_data?.file_type === 'file' ? doc.file_data?.file_name : ''
    })
    // Reset replacement file when starting to edit
    setReplacementFile(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData({})
    setReplacementFile(null)
  }

  const handleFileReplacement = (e) => {
    const file = e.target.files[0]
    if (file) {
      setReplacementFile(file)
    }
  }

  const openReplaceModal = (doc) => {
    setFileToReplace(doc)
    setShowReplaceModal(true)
  }

  const closeReplaceModal = () => {
    setShowReplaceModal(false)
    setFileToReplace(null)
  }

  const handleReplaceFileFromModal = (e) => {
    const newFile = e.target.files[0]
    if (!newFile || !fileToReplace) return

    setReplacementFile(newFile)
    closeReplaceModal()
    toast.success(`File "${newFile.name}" will replace "${fileToReplace.file_data?.data?.filename || 'current file'}" when you save changes`)
    
    // Clear the input
    e.target.value = ''
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const saveEdit = async (docId) => {
    try {
      // If there's a replacement file, use FormData, otherwise use JSON
      if (replacementFile) {
        const formData = new FormData()
        formData.append('documentId', docId)
        formData.append('replacementFile', replacementFile)
        
        // Add all edit form data
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key]) {
            formData.append(key, editFormData[key])
          }
        })

        const response = await fetch(`/api/projects/slug/${slug}/financials`, {
          method: 'PUT',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Financial document updated successfully')
          handleRefresh()
          cancelEditing()
        } else {
          toast.error(result.error || 'Failed to update financial document')
        }
      } else {
        // No file replacement, use JSON
        const response = await fetch(`/api/projects/slug/${slug}/financials`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentId: docId,
            ...editFormData
          })
        })

        const result = await response.json()

        if (result.success) {
          toast.success('Financial document updated successfully')
          handleRefresh()
          cancelEditing()
        } else {
          toast.error(result.error || 'Failed to update financial document')
        }
      }
    } catch (error) {
      console.error('Error updating financial document:', error)
      toast.error('Error updating financial document')
    }
  }

  // File and link management functions
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      comment: ''
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleFileUploadFromModal = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      comment: ''
    }))
    setFiles(prev => [...prev, ...newFiles])
    setShowFileUploadModal(false) // Close modal after selecting files
  }

  const handleLinkAddFromModal = () => {
    if (newLink.trim()) {
      const newLinkObj = {
        id: Date.now() + Math.random(),
        link: newLink.trim(),
        name: newLink.trim(),
        comment: ''
      }
      setLinks(prev => [...prev, newLinkObj])
      setNewLink('')
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const removeLink = (linkId) => {
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  const handleFileCommentChange = (fileId, comment) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, comment } : f))
  }

  const handleLinkCommentChange = (linkId, comment) => {
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, comment } : l))
  }


  const startEditingLink = (linkId, currentName) => {
    setEditingLinkId(linkId)
    setEditingLinkName(currentName)
  }

  const saveEditingLink = () => {
    setLinks(prev => prev.map(l => 
      l.id === editingLinkId ? { ...l, name: editingLinkName, link: editingLinkName } : l
    ))
    setEditingLinkId(null)
    setEditingLinkName('')
  }

  const cancelEditingLink = () => {
    setEditingLinkId(null)
    setEditingLinkName('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (files.length === 0 && links.length === 0) {
      toast.error('Please add at least one file or link')
      return
    }

    setSubmitting(true)
    setShowUploadModal(true)
    setUploadProgress(0)

    try {
      const formDataToSend = new FormData()
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })

      // Add files
      console.log('📤 Adding files to FormData:', files)
      files.forEach((fileObj, index) => {
        console.log(`  - Adding file_${index}:`, fileObj.file.name, fileObj.file.size, 'bytes')
        formDataToSend.append(`file_${index}`, fileObj.file)
        formDataToSend.append(`comment_${fileObj.file.name}`, fileObj.comment)
      })

      // Add links
      console.log('🔗 Adding links to FormData:', links)
      links.forEach((link, index) => {
        console.log(`  - Adding link_${index}:`, link.link)
        formDataToSend.append(`link_${index}`, link.link)
        formDataToSend.append(`link_comment_${index}`, link.comment)
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/projects/slug/${slug}/financials`, {
        method: 'POST',
        body: formDataToSend
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()
      console.log('📥 API Response:', result)

      if (result.success) {
        toast.success(`Successfully uploaded ${result.count} financial document(s)`)
        setFormData({
        documentType: '',
        projectPhase: '',
        subMenu: '',
          subSubMenu: '',
        financialAmount: '',
        documentDate: '',
        dueDate: '',
        priority: 'medium',
        specialNotes: '',
        generalComments: ''
        })
        setFiles([])
        setLinks([])
        handleRefresh()
      } else {
        console.error('❌ Upload failed:', result)
        const errorMessage = result.error || result.details || 'Failed to upload financial documents'
        toast.error(`Upload failed: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error uploading financial documents:', error)
      toast.error('Error uploading financial documents')
    } finally {
      setSubmitting(false)
      setTimeout(() => {
        setShowUploadModal(false)
        setUploadProgress(0)
      }, 1000)
    }
  }

  const confirmDelete = (document) => {
    setFileToDelete(document)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/projects/slug/${slug}/financials?id=${fileToDelete.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Financial document deleted successfully')
        handleRefresh()
        setShowDeleteModal(false)
        setFileToDelete(null)
      } else {
        toast.error(result.error || 'Failed to delete financial document')
      }
    } catch (error) {
      console.error('Error deleting financial document:', error)
      toast.error('Error deleting financial document')
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setFileToDelete(null)
  }

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === financials.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(financials.map(doc => doc.id))
    }
  }

  const confirmBulkDelete = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to delete')
      return
    }
    setShowBulkDeleteModal(true)
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return

    setDeleting(true)
    try {
      const deletePromises = selectedFiles.map(fileId => 
        fetch(`/api/projects/slug/${slug}/financials?id=${fileId}`, {
          method: 'DELETE'
        })
      )

      const responses = await Promise.all(deletePromises)
      const results = await Promise.all(responses.map(r => r.json()))

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} financial document(s)`)
        handleRefresh()
        setSelectedFiles([])
        setShowBulkDeleteModal(false)
      }

      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} document(s)`)
      }
    } catch (error) {
      console.error('Error bulk deleting financial documents:', error)
      toast.error('Error deleting financial documents')
    } finally {
      setDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500">      </div>

      </div>
    )
  }

  if (!user || (user.userRole !== 'admin' && user.userRole !== 'finance')) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Financial Documents
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage financial documents for {slug}
        </p>
        </div>

      {/* Upload Form */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Add New Financial Document
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Financial Document Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type */}
              <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type *
                </label>
                <select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                  required
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Document Type</option>
                {financeDocumentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.documentType}
                  </option>
                  ))}
                </select>
              </div>

            {/* Project Phase */}
              <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Phase
                </label>
                <select
                name="projectPhase"
                value={formData.projectPhase}
                onChange={handleInputChange}
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Project Phase</option>
                <option value="pre-contract">Pre-Contract</option>
                <option value="post-contract">Post-Contract</option>
                </select>
              </div>

            {/* Sub Menu */}
              <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sub Menu
              </label>
              <select
                name="subMenu"
                value={formData.subMenu}
                onChange={handleInputChange}
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Sub Menu</option>
                {formData.projectPhase === 'pre-contract' && (
                  <>
                    <option value="advert">Advert</option>
                    <option value="eoi">EOI</option>
                    <option value="meep">MEEP</option>
                    <option value="rfp">RFP</option>
                    <option value="structural-designs">Structural Designs</option>
                    <option value="bill-of-quantities">Bill of Quantities</option>
                    <option value="architectural">Architectural</option>
                    <option value="specification">Specification</option>
                    <option value="acceptance-letter">Acceptance Letter</option>
                    <option value="award-letter">Award Letter</option>
                    <option value="signing">Signing</option>
                  </>
                )}
                {formData.projectPhase === 'post-contract' && (
                  <>
                    <option value="inception">Inception</option>
                    <option value="progress-reports">Progress Reports</option>
                    <option value="site-meeting-minutes">Site Meeting Minutes</option>
                    <option value="invoice-claims">Invoice Claims</option>
                    <option value="handing-over">Handing Over</option>
                    <option value="defect-liability">Defect Liability</option>
                    <option value="final-account">Final Account</option>
                    <option value="mobilization">Mobilization</option>
                    <option value="ipcs">IPCs</option>
                  </>
                )}
              </select>
            </div>


            {/* Financial Amount */}
            <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Financial Amount
              </label>
              <input
                type="number"
                name="financialAmount"
                value={formData.financialAmount}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            {/* Document Date */}
            <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Date
                </label>
                <input
                  type="date"
                name="documentDate"
                value={formData.documentDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

            {/* Due Date */}
              <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

            {/* Priority */}
            <div>
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Special Notes
            </label>
            <textarea
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter special notes"
            />
          </div>

          {/* General Comments */}
          <div>
            <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              General Comments
            </label>
            <textarea
              name="generalComments"
              value={formData.generalComments}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter general comments"
            />
          </div>

          {/* Add New Content Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setShowFileUploadModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
            >
              <FiUpload className="text-lg" />
              <span>Upload Files</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
            >
              <FiFile className="text-lg" />
              <span>Add Links</span>
            </button>
          </div>

          {/* New Files Display */}
          {(files.length > 0 || links.length > 0) && (
            <div className="space-y-4">
              <h3 className="!text-sm font-medium text-gray-900 dark:text-white">
                New Files ({files.length + links.length})
            </h3>
              
              {/* Files */}
              {files.map((file) => (
                <div key={file.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <FiFile className="text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded flex-shrink-0">
                            FILE
                          </span>
                          <span
                            className="!text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip'
                          input.onchange = (e) => {
                            const newFile = e.target.files[0]
                            if (newFile) {
                              setFiles(prev => prev.map(f => 
                                f.id === file.id ? { ...f, file: newFile, name: newFile.name } : f
                              ))
                              toast.success(`File replaced with: ${newFile.name}`)
                            }
                          }
                          input.click()
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Replace file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

              <div>
                    <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Comment for this file
                    </label>
                    <textarea
                      value={file.comment || ''}
                      onChange={(e) => handleFileCommentChange(file.id, e.target.value)}
                      rows={2}
                      placeholder="Add a special comment about this file..."
                      className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              ))}

              {/* Links */}
              {links.map((link) => (
                <div key={link.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <FiFile className="text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded flex-shrink-0">
                            LINK
                          </span>
                          {editingLinkId === link.id ? (
                            <input
                              type="text"
                              value={editingLinkName}
                              onChange={(e) => setEditingLinkName(e.target.value)}
                              className="flex-1 px-2 py-1 !text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white min-w-0"
                              onKeyPress={(e) => e.key === 'Enter' && saveEditingLink()}
                              autoFocus
                            />
                          ) : (
                            <Link
                              href={link.link || link.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[300px] underline"
                              title={`Click to open: ${link.name}`}
                            >
                              {link.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingLinkId === link.id ? (
                        <>
                          <button
                            onClick={saveEditingLink}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Save"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditingLink}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Cancel"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditingLink(link.id, link.name)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLink(link.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Comment for this link
                    </label>
                    <textarea
                      value={link.comment || ''}
                      onChange={(e) => handleLinkCommentChange(link.id, e.target.value)}
                      rows={2}
                      placeholder="Add a special comment about this link..."
                      className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed !text-sm"
            >
              <FiSave className="text-lg" />
              <span>{submitting ? 'Uploading...' : 'UPLOAD FILES'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Financial Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Financial Documents ({financials.length} of {totalCount})
          </h3>
          
          {financials.length > 0 && (
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {selectedFiles.length === financials.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedFiles.length > 0 && (
                <button
                  onClick={confirmBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Selected ({selectedFiles.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {financials.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No financial documents found
          </p>
        ) : (
          <div className="space-y-4">
            {financials.map((doc) => (
              <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {/* File Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(doc.id)}
                      onChange={() => handleSelectFile(doc.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded flex-shrink-0">
                          {doc.file_data?.file_type === 'link' ? 'LINK' : 'FILE'}
                        </span>
                        {doc.file_data?.file_type === 'link' ? (
                          <a 
                            href={doc.file_data?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[300px] underline"
                            title={`Click to open: ${doc.file_data?.link}`}
                          >
                            {doc.file_data?.link}
                          </a>
                        ) : (
                          <span 
                            className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]"
                            title={doc.file_data?.data?.filename}
                          >
                            {doc.file_data?.data?.filename}
                          </span>
                        )}
                      </div>
                      <p className="!text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingId === doc.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(doc.id)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Save changes"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Cancel editing"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        {doc.file_data?.file_type === 'file' && doc.file_data?.link && (
                          <button
                            type="button"
                            onClick={() => window.open(doc.file_data.link, '_blank')}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Download file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        {doc.file_data?.file_type === 'file' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openReplaceModal(doc)}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Replace file"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditing(doc)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit document metadata"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(doc)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit link metadata"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => confirmDelete(doc)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete document"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Document Details - Editable */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-3">
                  {editingId === doc.id ? (
                    <div className="space-y-4">
                      {/* Document Type */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Document Type *
                        </label>
                        <select
                          name="documentType"
                          value={editFormData.documentType}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                          <option value="">Select Document Type</option>
                          {financeDocumentTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.documentType}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Project Phase */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Project Phase
                        </label>
                        <select
                          name="projectPhase"
                          value={editFormData.projectPhase}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                          <option value="">Select Project Phase</option>
                          <option value="pre-contract">Pre-Contract</option>
                          <option value="post-contract">Post-Contract</option>
                          <option value="general">General</option>
                        </select>
                      </div>

                      {/* Sub Menu */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sub Menu
                        </label>
                        <select
                          name="subMenu"
                          value={editFormData.subMenu}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                          <option value="">Select Sub Menu</option>
                          {editFormData.projectPhase === 'pre-contract' && (
                            <>
                              <option value="advert">Advert</option>
                              <option value="eoi">EOI</option>
                              <option value="meep">MEEP</option>
                              <option value="rfp">RFP</option>
                              <option value="structural-designs">Structural Designs</option>
                              <option value="bill-of-quantities">Bill of Quantities</option>
                              <option value="architectural">Architectural</option>
                              <option value="specification">Specification</option>
                              <option value="acceptance-letter">Acceptance Letter</option>
                              <option value="award-letter">Award Letter</option>
                              <option value="signing">Signing</option>
                            </>
                          )}
                          {editFormData.projectPhase === 'post-contract' && (
                            <>
                              <option value="inception">Inception</option>
                              <option value="progress-reports">Progress Reports</option>
                              <option value="site-meeting-minutes">Site Meeting Minutes</option>
                              <option value="invoice-claims">Invoice Claims</option>
                              <option value="handing-over">Handing Over</option>
                              <option value="defect-liability">Defect Liability</option>
                              <option value="final-account">Final Account</option>
                              <option value="mobilization">Mobilization</option>
                              <option value="ipcs">IPCs</option>
                            </>
                          )}
                          <option value="general">General</option>
                        </select>
                      </div>

                      {/* Financial Amount */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Financial Amount
                        </label>
                        <input
                          type="number"
                          name="financialAmount"
                          value={editFormData.financialAmount || ''}
                          onChange={handleEditInputChange}
                          step="0.01"
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="Enter amount"
                        />
                      </div>

                      {/* Document Date */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Document Date
                        </label>
                        <input
                          type="date"
                          name="documentDate"
                          value={editFormData.documentDate || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          name="dueDate"
                          value={editFormData.dueDate || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={editFormData.priority}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      {/* Special Notes */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Special Notes
                        </label>
                        <textarea
                          name="specialNotes"
                          value={editFormData.specialNotes || ''}
                          onChange={handleEditInputChange}
                          rows={3}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="Enter special notes"
                        />
                      </div>

                      {/* General Comments */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          General Comments
                        </label>
                        <textarea
                          name="generalComments"
                          value={editFormData.generalComments || ''}
                          onChange={handleEditInputChange}
                          rows={3}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder="Enter general comments"
                        />
                      </div>

                      {/* File Replacement (for files only) */}
                      {doc.file_data?.file_type === 'file' && (
                        <div>
                          <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Replace File
                          </label>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                openReplaceModal(doc)
                              }}
                              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 transition-colors !text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Select New File</span>
                            </button>
                            {replacementFile && (
                              <div className="text-sm text-green-600 dark:text-green-400">
                                ✓ New file selected: {replacementFile.name}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Current file: {doc.file_data?.data?.filename || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Link URL (for links) */}
                      {doc.file_data?.file_type === 'link' && (
                        <div>
                          <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Edit Link URL
                          </label>
                          <input
                            type="url"
                            name="linkUrl"
                            value={editFormData.linkUrl || ''}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            placeholder="Enter link URL"
                          />
                        </div>
                      )}

                      {/* File/Link Comment */}
                      <div>
                        <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {doc.file_data?.file_type === 'file' ? 'File Comment' : 'Link Comment'}
                        </label>
                        <textarea
                          name="fileComment"
                          value={editFormData.fileComment || ''}
                          onChange={handleEditInputChange}
                          rows={2}
                          className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                          placeholder={`Enter comment for this ${doc.file_data?.file_type === 'file' ? 'file' : 'link'}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="!text-sm font-medium text-gray-900 dark:text-white">
                          {doc.finance_documents?.documentType || 'Unknown Document Type'}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 !text-xs rounded">
                          {doc.project_phase}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 !text-xs rounded">
                          {doc.sub_menu}
                        </span>
                        <span className={`px-2 py-1 !text-xs rounded ${
                          doc.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          doc.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                          doc.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                        }`}>
                          {doc.priority}
                        </span>
                      </div>
                      
                      <div className="!text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {doc.financial_amount && (
                          <p><strong>Amount:</strong> ${doc.financial_amount.toLocaleString()}</p>
                        )}
                        {doc.document_date && (
                          <p><strong>Document Date:</strong> {new Date(doc.document_date).toLocaleDateString()}</p>
                        )}
                        {doc.due_date && (
                          <p><strong>Due Date:</strong> {new Date(doc.due_date).toLocaleDateString()}</p>
                        )}
                        {doc.special_notes && (
                          <p><strong>Special Notes:</strong> {doc.special_notes}</p>
                        )}
                        {doc.general_comments && (
                          <p><strong>Comments:</strong> {doc.general_comments}</p>
                        )}
                        {doc.file_data?.comment && (
                          <p><strong>File Comment:</strong> {doc.file_data.comment}</p>
                        )}
                    </div>
                      </div>
                    )}
                </div>
                  </div>
                ))}
            </div>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading more documents...</span>
            </div>
          )}

          {/* End of Results */}
          {!hasMore && financials.length > 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p>You've reached the end of the list</p>
            </div>
          )}
      </div>

      {/* File Upload Modal */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Files
            </h3>
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <p className="!text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select files to add to this financial document. You can upload multiple files at once.
            </p>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-4">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="!text-sm text-gray-600 dark:text-gray-400 mb-4">
                <label htmlFor="modal-file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Select files</span>
                    <input
                    id="modal-file-upload"
                    name="modal-file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
                    onChange={handleFileUploadFromModal}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
              <p className="!text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, XLSX, XLS, JPG, PNG, ZIP up to 10MB each
                </p>
              </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowFileUploadModal(false)}
                className="px-4 py-2 !text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('modal-file-upload').click()}
                className="px-4 py-2 !text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Files
              </button>
            </div>
                        </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Links
              </h3>
                        <button
                onClick={() => {
                  setShowLinkModal(false)
                  setNewLink('')
                  setEditingLinkId(null)
                  setEditingLinkName('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
                        </button>
                      </div>
            <p className="!text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add web links or URLs to this financial document. You can add multiple links.
            </p>

            {/* Add New Link */}
            <div className="mb-6">
              <label className="block !text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Link URL
                        </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 !text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLinkAddFromModal()}
                />
              <button
                type="button"
                  onClick={handleLinkAddFromModal}
                  disabled={!newLink.trim()}
                  className="px-4 py-2 !text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Add
              </button>
                      </div>
            </div>

            {/* Added Links List */}
            {links.length > 0 && (
              <div className="mb-6">
                <h4 className="!text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Added Links ({links.length})
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {editingLinkId === link.id ? (
                        <>
                          <input
                            type="text"
                            value={editingLinkName}
                            onChange={(e) => setEditingLinkName(e.target.value)}
                            className="flex-1 px-2 py-1 !text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && saveEditingLink()}
                            autoFocus
                          />
                          <button
                            onClick={saveEditingLink}
                            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Save"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditingLink}
                            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Cancel"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 !text-sm text-gray-900 dark:text-white truncate">
                            {link.name}
                          </span>
                          <button
                            onClick={() => startEditingLink(link.id, link.name)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeLink(link.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                        </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                onClick={() => {
                  setShowLinkModal(false)
                  setNewLink('')
                  setEditingLinkId(null)
                  setEditingLinkName('')
                }}
                className="px-4 py-2 !text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Done
                        </button>
                      </div>
          </div>
      </div>
      )}

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                      </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Uploading Financial Documents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please wait while we process your files...</p>
                    </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">{uploadProgress}% Complete</p>
              </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Financial Document
            </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete this financial document? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {fileToDelete.file_data?.file_type === 'link' ? 'Link:' : 'File:'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {fileToDelete.file_data?.file_type === 'link' 
                    ? fileToDelete.file_data?.link 
                    : fileToDelete.file_data?.data?.filename || 'Unknown file'
                  }
                </p>
          </div>

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Multiple Documents
            </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete <strong>{selectedFiles.length}</strong> financial document(s)? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Selected documents:
                </p>
                <div className="max-h-32 overflow-y-auto text-left">
                  {financials
                    .filter(doc => selectedFiles.includes(doc.id))
                    .map(doc => (
                      <div key={doc.id} className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                        {doc.file_data?.file_type === 'link' 
                          ? doc.file_data?.link 
                          : doc.file_data?.data?.filename || 'Unknown file'
                        }
          </div>
                    ))
                  }
      </div>
              </div>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={cancelBulkDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{deleting ? 'Deleting...' : `Delete ${selectedFiles.length} Document(s)`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace File Modal */}
      {showReplaceModal && fileToReplace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Replace File
              </h3>
              <button
                onClick={closeReplaceModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a new file to replace "{fileToReplace.file_data?.data?.filename || 'current file'}".
            </p>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <label htmlFor="replace-file-modal" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Select new file</span>
                  <input
                    id="replace-file-modal"
                    name="replace-file-modal"
                    type="file"
                    onChange={handleReplaceFileFromModal}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, XLSX, XLS, JPG, PNG, ZIP up to 100MB
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeReplaceModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('replace-file-modal').click()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}