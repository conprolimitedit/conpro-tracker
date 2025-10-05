'use client'

import React, { useState, useEffect } from 'react'
import { FiSave, FiUpload, FiFile, FiX, FiDownload, FiEdit3, FiTrash2, FiCheck, FiXCircle, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-toastify'
import Link from 'next/link'

const FinancialsUpload = ({ projectSlug, onRefresh }) => {
  const [formData, setFormData] = useState({
    documentType: '',
    projectPhase: '',
    subMenu: '',
    financialAmount: '',
    documentDate: '',
    dueDate: '',
    priority: 'medium',
    specialNotes: '',
    generalComments: ''
  })

  const [files, setFiles] = useState([])
  const [links, setLinks] = useState([])
  const [existingFiles, setExistingFiles] = useState([])
  const [financeDocumentTypes, setFinanceDocumentTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [fileToDelete, setFileToDelete] = useState(null)
  const [editedFiles, setEditedFiles] = useState([])
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [editingFileId, setEditingFileId] = useState(null)
  const [editingFileName, setEditingFileName] = useState('')
  const [replacingFileId, setReplacingFileId] = useState(null)
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [editingLinkName, setEditingLinkName] = useState('')
  const [editingExistingLinkId, setEditingExistingLinkId] = useState(null)
  const [editingExistingLinkName, setEditingExistingLinkName] = useState('')
  const [newLink, setNewLink] = useState('')

  // Phase sub-menu mapping
  const phaseSubMenus = {
    'pre-contract': [
      'advert', 'eoi', 'meep', 'rfp', 'structural-designs', 
      'tender-documents', 'contract-documents'
    ],
    'post-contract': [
      'consultant', 'contractor'
    ]
  }

  const consultantSubMenus = [
    'inception', 'progress-reports', 'site-meeting-minutes', 
    'invoice-claims', 'handing-over', 'defect-liability', 'final-account'
  ]

  const contractorSubMenus = [
    'mobilization', 'progress-reports', 'site-meeting-minutes', 
    'ipcs', 'handing-over', 'defect-liability', 'final-account'
  ]

  const tenderDocumentsSubMenus = [
    'conceptual', 'specification', 'bill-of-quantities'
  ]

  const contractDocumentsSubMenus = [
    'acceptance-letter', 'award-letter', 'signing'
  ]

  // Get available sub-menus based on selected phase
  const getAvailableSubMenus = () => {
    if (!formData.projectPhase) return []
    
    if (formData.projectPhase === 'post-contract') {
      return phaseSubMenus['post-contract']
    }
    
    if (formData.projectPhase === 'pre-contract') {
      return phaseSubMenus['pre-contract']
    }
    
    return []
  }

  // Get sub-sub-menus for consultant/contractor
  const getSubSubMenus = () => {
    if (formData.subMenu === 'consultant') {
      return consultantSubMenus
    }
    if (formData.subMenu === 'contractor') {
      return contractorSubMenus
    }
    if (formData.subMenu === 'tender-documents') {
      return tenderDocumentsSubMenus
    }
    if (formData.subMenu === 'contract-documents') {
      return contractDocumentsSubMenus
    }
    return []
  }

  useEffect(() => {
    fetchFinanceDocumentTypes()
    fetchExistingFiles()
  }, [])

  const fetchFinanceDocumentTypes = async () => {
    try {
      const response = await fetch('/api/finance-documents')
      const data = await response.json()
      
      if (data.success) {
        setFinanceDocumentTypes(data.financeDocuments)
      } else {
        toast.error('Failed to fetch document types')
      }
    } catch (error) {
      console.error('Error fetching finance document types:', error)
      toast.error('Error fetching document types')
    }
  }

  const fetchExistingFiles = async () => {
    try {
      const response = await fetch(`/api/projects/slug/${projectSlug}/financials`)
      const data = await response.json()
      
      if (data.success) {
        // Transform the files data to match the component's expected format
        const transformedFiles = data.documents.map(doc => {
          const fileData = doc.file_data
          
          return {
            id: doc.id,
            name: fileData?.file_type === 'link' 
              ? fileData.file_link?.link || fileData.file_name
              : fileData?.file_name || 'Unknown file',
            url: fileData?.file_url || fileData?.file_link?.link || '',
            type: fileData?.file_type === 'link' ? 'LINK' : 'FILE',
            comment: fileData?.comment || '',
            uploadDate: new Date(doc.created_at).toLocaleDateString(),
            file_data: fileData,
            documentType: doc.finance_documents?.documentType,
            projectPhase: doc.project_phase,
            subMenu: doc.sub_menu,
            financialAmount: doc.financial_amount,
            documentDate: doc.document_date,
            dueDate: doc.due_date,
            priority: doc.priority,
            specialNotes: doc.special_notes,
            generalComments: doc.general_comments
          }
        })
        
        setExistingFiles(transformedFiles)
      } else {
        console.error('Error fetching financial files:', data.error)
        setExistingFiles([])
      }
    } catch (error) {
      console.error('Error fetching financial files:', error)
      setExistingFiles([])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Reset sub-menu when phase changes
    if (name === 'projectPhase') {
      setFormData(prev => ({
        ...prev,
        subMenu: ''
      }))
    }
  }

  // File management functions
  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      comment: '',
      file_type: 'file',
      id: Date.now() + Math.random()
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleFileCommentChange = (fileId, comment) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, comment } : file
    ))
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const startEditingFile = (fileId, currentName) => {
    setEditingFileId(fileId)
    setEditingFileName(currentName)
  }

  const saveEditingFile = () => {
    if (editingFileId && editingFileName.trim()) {
      setFiles(prev => prev.map(file => 
        file.id === editingFileId ? { ...file, name: editingFileName.trim() } : file
      ))
      setEditingFileId(null)
      setEditingFileName('')
    }
  }

  const cancelEditingFile = () => {
    setEditingFileId(null)
    setEditingFileName('')
  }

  const startReplacingFile = (fileId) => {
    setReplacingFileId(fileId)
    const fileInput = document.getElementById('replace-file-input')
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleFileReplacement = (e) => {
    const newFile = e.target.files[0]
    if (!newFile || !replacingFileId) return

    setFiles(prev => prev.map(file => 
      file.id === replacingFileId 
        ? { ...file, file: newFile, name: newFile.name }
        : file
    ))

    setReplacingFileId(null)
    e.target.value = ''
  }

  const startReplacingExistingFile = (fileId) => {
    setReplacingFileId(fileId)
    const fileInput = document.getElementById('replace-existing-file-input')
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleExistingFileReplacement = (e) => {
    const newFile = e.target.files[0]
    if (!newFile || !replacingFileId) return

    const existingFile = existingFiles.find(f => f.id === replacingFileId)
    if (!existingFile) return

    const editedFile = {
      id: existingFile.id,
      originalFile: existingFile,
      newFile: newFile,
      type: 'file_replacement',
      comment: existingFile.comment || ''
    }

    setEditedFiles(prev => {
      const filtered = prev.filter(f => f.id !== replacingFileId)
      return [...filtered, editedFile]
    })

    setExistingFiles(prev => prev.map(file => 
      file.id === replacingFileId 
        ? { ...file, name: newFile.name, url: URL.createObjectURL(newFile) }
        : file
    ))

    setReplacingFileId(null)
    e.target.value = ''
    
    toast.success(`File "${newFile.name}" will replace "${existingFile.name}" when you save changes`)
  }

  // Link management functions
  const addLink = () => {
    setShowLinkModal(true)
  }

  const handleLinkCommentChange = (linkId, comment) => {
    setLinks(prev => prev.map(link => 
      link.id === linkId ? { ...link, comment } : link
    ))
  }

  const removeLink = (linkId) => {
    setLinks(prev => prev.filter(link => link.id !== linkId))
  }

  const addNewFile = () => {
    setShowFileUploadModal(true)
  }

  const handleFileUploadFromModal = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      name: file.name,
      comment: '',
      file_type: 'file',
      id: Date.now() + Math.random()
    }))
    setFiles(prev => [...prev, ...newFiles])
    setShowFileUploadModal(false)
    
    toast.success(`Successfully added ${newFiles.length} file(s)!`)
  }

  const handleLinkAddFromModal = () => {
    if (newLink.trim()) {
      setLinks(prev => [...prev, { 
        name: newLink.trim(), 
        comment: '', 
        file_type: 'link',
        link: newLink.trim(),
        data: {},
        id: Date.now() + Math.random() 
      }])
      setNewLink('')
      
      toast.success('Link added successfully!')
    } else {
      toast.error('Please enter a valid URL')
    }
  }

  const startEditingLink = (linkId, currentName) => {
    setEditingLinkId(linkId)
    setEditingLinkName(currentName)
  }

  const saveEditingLink = () => {
    if (editingLinkId && editingLinkName.trim()) {
      setLinks(prev => prev.map(link => 
        link.id === editingLinkId ? { ...link, name: editingLinkName.trim(), link: editingLinkName.trim() } : link
      ))
      setEditingLinkId(null)
      setEditingLinkName('')
    }
  }

  const cancelEditingLink = () => {
    setEditingLinkId(null)
    setEditingLinkName('')
  }

  const startEditingExistingLink = (linkId, currentName) => {
    setEditingExistingLinkId(linkId)
    setEditingExistingLinkName(currentName)
  }

  const saveEditingExistingLink = () => {
    if (editingExistingLinkId && editingExistingLinkName.trim()) {
      const existingFile = existingFiles.find(f => f.id === editingExistingLinkId)
      if (!existingFile) return

      const editedFile = {
        id: existingFile.id,
        originalFile: existingFile,
        newLink: editingExistingLinkName.trim(),
        type: 'link_edit',
        comment: existingFile.comment || ''
      }

      setEditedFiles(prev => {
        const filtered = prev.filter(f => f.id !== editingExistingLinkId)
        return [...filtered, editedFile]
      })

      setExistingFiles(prev => prev.map(file => 
        file.id === editingExistingLinkId 
          ? { ...file, name: editingExistingLinkName.trim(), url: editingExistingLinkName.trim() }
          : file
      ))
      
      setEditingExistingLinkId(null)
      setEditingExistingLinkName('')
      
      toast.success(`Link will be updated when you save changes`)
    }
  }

  const cancelEditingExistingLink = () => {
    setEditingExistingLinkId(null)
    setEditingExistingLinkName('')
  }

  const confirmDeleteFile = (file) => {
    setFileToDelete(file)
    setShowDeleteModal(true)
  }

  const deleteExistingFile = async () => {
    if (!fileToDelete) return

    try {
      const response = await fetch(`/api/projects/slug/${projectSlug}/financials`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId: fileToDelete.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete file')
      }

      setExistingFiles(prev => prev.filter(f => f.id !== fileToDelete.id))
      console.log('File deleted successfully')
      toast.success('File deleted successfully')
      
      setShowDeleteModal(false)
      setFileToDelete(null)
      
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error(`Error deleting file: ${error.message}`)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setFileToDelete(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.documentType || !formData.projectPhase || !formData.subMenu) {
      toast.error('Please fill in all required fields')
      return
    }

    if (files.length === 0 && links.length === 0) {
      toast.error('Please upload at least one file or add a link')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)
    setUploadingFiles([...files, ...links])

    try {
      const submitData = new FormData()
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key])
        }
      })

      // Add files
      files.forEach((fileData, index) => {
        if (fileData.file) {
          submitData.append(`file_${index}`, fileData.file)
        }
      })

      // Add links
      links.forEach((link, index) => {
        submitData.append(`link_${index}`, JSON.stringify({
          link: link.link,
          comment: link.comment
        }))
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)

      const response = await fetch(`/api/projects/slug/${projectSlug}/financials`, {
        method: 'POST',
        body: submitData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        toast.success(`Successfully saved ${result.uploadedFiles} files and ${result.uploadedLinks} links`)
        
        // Reset form
        setFormData({
          documentType: '',
          projectPhase: '',
          subMenu: '',
          financialAmount: '',
          documentDate: '',
          dueDate: '',
          priority: 'medium',
          specialNotes: '',
          generalComments: ''
        })
        setFiles([])
        setLinks([])
        setEditedFiles([])
        
        // Refresh existing files
        await fetchExistingFiles()
        
        if (onRefresh) {
          onRefresh()
        }
      } else {
        toast.error(result.error || 'Failed to save financial document')
      }
    } catch (error) {
      console.error('Error submitting financial document:', error)
      toast.error('Error submitting financial document')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
      setUploadingFiles([])
    }
  }

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading financial data...</p>
        </div>
      </div>
    )
  }

  // Upload Progress Overlay
  const UploadProgressOverlay = () => {
    if (!submitting) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white relative dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Uploading Files...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please wait while your files are being uploaded
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(uploadProgress)}% complete
            </p>
            
            {/* Uploading Files List */}
            {uploadingFiles.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Uploading:
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !fileToDelete) return null

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <FiTrash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete {fileToDelete.type === 'FILE' ? 'File' : 'Link'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>"{fileToDelete.name}"</strong>? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3 justify-center">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteExistingFile}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Sticky Save Button */}
      <div className="fixed bottom-2 md:w-full md:w-[60vw] left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="px-4 py-4">
          <div className="flex justify-center">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
            >
              <FiSave className="text-lg" />
              <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-6">
        <div className="flex items-center self-start space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Financial Documents
            </h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Project: {projectSlug}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload and manage financial documents for this project
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-x-hidden px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-none">
          {/* Financial Document Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Financial Document Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type *
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Phase *
                </label>
                <select
                  name="projectPhase"
                  value={formData.projectPhase}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Project Phase</option>
                  <option value="pre-contract">Pre-Contract</option>
                  <option value="post-contract">Post-Contract</option>
                </select>
              </div>

              {/* Sub Menu */}
              {formData.projectPhase && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub Menu *
                  </label>
                  <select
                    name="subMenu"
                    value={formData.subMenu}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Sub Menu</option>
                    {getAvailableSubMenus().map(subMenu => (
                      <option key={subMenu} value={subMenu}>
                        {subMenu.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-Sub Menu for consultant/contractor */}
              {formData.subMenu && (formData.subMenu === 'consultant' || formData.subMenu === 'contractor' || formData.subMenu === 'tender-documents' || formData.subMenu === 'contract-documents') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.subMenu === 'consultant' ? 'Consultant Phase' : 
                     formData.subMenu === 'contractor' ? 'Contractor Phase' :
                     formData.subMenu === 'tender-documents' ? 'Tender Document Type' :
                     'Contract Document Type'}
                  </label>
                  <select
                    name="subSubMenu"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Option</option>
                    {getSubSubMenus().map(subSubMenu => (
                      <option key={subSubMenu} value={subSubMenu}>
                        {subSubMenu.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Financial Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Financial Amount
                </label>
                <input
                  type="number"
                  name="financialAmount"
                  value={formData.financialAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter amount"
                />
              </div>

              {/* Document Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Date
                </label>
                <input
                  type="date"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Special Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Notes
              </label>
              <textarea
                name="specialNotes"
                value={formData.specialNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter special notes"
              />
            </div>

            {/* General Comments */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Comments
              </label>
              <textarea
                name="generalComments"
                value={formData.generalComments}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter general comments"
              />
            </div>
          </div>

          {/* Add New Content Button */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Add New Content
            </h3>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={addNewFile}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
              >
                <FiUpload className="text-lg" />
                <span>Upload Files</span>
              </button>
              
              <button
                type="button"
                onClick={addLink}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
              >
                <FiFile className="text-lg" />
                <span>Add Links</span>
              </button>
            </div>
          </div>

          {/* New Files Section - Combined Files and Links */}
          {(files.length > 0 || links.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                New Files ({files.length + links.length})
              </h3>
              <div className="space-y-4">
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
                            {editingFileId === file.id ? (
                              <input
                                type="text"
                                value={editingFileName}
                                onChange={(e) => setEditingFileName(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white min-w-0"
                                onKeyPress={(e) => e.key === 'Enter' && saveEditingFile()}
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingFileId === file.id ? (
                          <>
                            <button
                              onClick={saveEditingFile}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Save"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditingFile}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Cancel"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startReplacingFile(file.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Replace file"
                            >
                              <FiRefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFile(file.id)}
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Special Comment for this file
                      </label>
                      <textarea
                        value={file.comment || ''}
                        onChange={(e) => handleFileCommentChange(file.id, e.target.value)}
                        rows={2}
                        placeholder="Add a special comment about this file..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white min-w-0"
                                onKeyPress={(e) => e.key === 'Enter' && saveEditingLink()}
                                autoFocus
                              />
                            ) : (
                              <Link 
                                href={link.link || link.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] underline"
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
                              onClick={() => startEditingLink(link.id, link.name)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                            <button
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Special Comment for this link
                      </label>
                      <textarea
                        value={link.comment || ''}
                        onChange={(e) => handleLinkCommentChange(link.id, e.target.value)}
                        rows={2}
                        placeholder="Add a special comment about this link..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Files Section */}
          {existingFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Existing Files ({existingFiles.length})
              </h3>
              <div className="space-y-4">
                {existingFiles.map((file) => (
                  <div key={file.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <FiFile className="text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded flex-shrink-0">
                              {file.type || 'FILE'}
                            </span>
                            {editingExistingLinkId === file.id ? (
                              <input
                                type="text"
                                value={editingExistingLinkName}
                                onChange={(e) => setEditingExistingLinkName(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white min-w-0"
                                onKeyPress={(e) => e.key === 'Enter' && saveEditingExistingLink()}
                                autoFocus
                              />
                            ) : (
                              file.type === 'LINK' ? (
                                <Link 
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] underline"
                                  title={`Click to open: ${file.name}`}
                                >
                                  {file.name}
                                </Link>
                              ) : (
                                <span 
                                  className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
                                  title={file.name}
                                >
                                {file.name}
                              </span>
                              )
                            )}
                          </div>
                          <p className="!text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Uploaded: {file.uploadDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.type === 'FILE' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startReplacingExistingFile(file.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Replace file"
                            >
                              <FiRefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Download file"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {editingExistingLinkId === file.id ? (
                              <>
                                <button
                                  onClick={saveEditingExistingLink}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                  title="Save"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditingExistingLink}
                                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                  title="Cancel"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditingExistingLink(file.id, file.name)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit link"
                              >
                                <FiEdit3 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => confirmDeleteFile(file)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title={`Delete ${file.type === 'FILE' ? 'file' : 'link'}`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {file.comment && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="!text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Comment:</span> {file.comment}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </form>
      </div>

      {/* Hidden file input for file replacement */}
      <input
        id="replace-file-input"
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
        onChange={handleFileReplacement}
        className="hidden"
      />

      {/* Hidden file input for existing file replacement */}
      <input
        id="replace-existing-file-input"
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.png,.zip"
        onChange={handleExistingFileReplacement}
        className="hidden"
      />

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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select files to add to this phase. You can upload multiple files at once.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-4">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, XLSX, XLS, JPG, PNG, ZIP up to 10MB each
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowFileUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('modal-file-upload').click()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add web links or URLs to this phase. You can add multiple links.
            </p>
            
            {/* Add New Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Link URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLinkAddFromModal()}
                />
                <button
                  type="button"
                  onClick={handleLinkAddFromModal}
                  disabled={!newLink.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Added Links List */}
            {links.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
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
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
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
                          <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay */}
      <UploadProgressOverlay />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  )
}

export default FinancialsUpload
