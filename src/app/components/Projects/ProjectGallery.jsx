'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  FiImage, 
  FiVideo, 
  FiUpload, 
  FiDownload, 
  FiEye, 
  FiX,
  FiPlus,
  FiRefreshCw,
  FiEdit3
} from 'react-icons/fi'

import UserHeader from '../UserHeader'


const ProjectGallery = () => {
  const params = useParams()
  const { slug } = params
  const isNewProject = slug === 'addNewProject'
  
  const [galleryItems, setGalleryItems] = useState([])
  const [loading, setLoading] = useState(!isNewProject)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [album, setAlbum] = useState('')
  const [replacingId, setReplacingId] = useState(null)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [albumNameInput, setAlbumNameInput] = useState('')
  const [albumTitleInput, setAlbumTitleInput] = useState('')
  const [albumFiles, setAlbumFiles] = useState([])
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameOld, setRenameOld] = useState('')
  const [renameNew, setRenameNew] = useState('')

  useEffect(() => {
    if (!isNewProject) {
      fetchGalleryData()
    }
  }, [slug])

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return

      const scrollContainer = document.querySelector('.gallery-scroll-container')
      if (!scrollContainer) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

      if (isNearBottom) {
        console.log('🔄 Loading more gallery items...')
        fetchGalleryData(currentPage + 1, true)
      }
    }

    const scrollContainer = document.querySelector('.gallery-scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [currentPage, hasMore, loadingMore])

  const fetchGalleryData = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      console.log(`🚀 Fetching gallery data for project: ${slug}, page: ${page}`)
      
      const response = await fetch(`/api/projects/slug/${slug}/gallery?page=${page}&limit=10${album ? `&album=${encodeURIComponent(album)}` : ''}`)
      const data = await response.json()
      
      if (data.success) {
        // Transform the data to match component format
        const transformedItems = data.items.map(item => ({
          id: item.id,
          name: item.file_data.name,
          type: item.file_data.type.startsWith('image/') ? 'image' : 'video',
          url: item.file_data.url,
          thumbnail: item.file_data.thumbnail || item.file_data.url,
          description: item.file_data.description || '',
          uploadDate: new Date(item.created_at).toLocaleDateString(),
          fileSize: `${(item.file_data.size / (1024 * 1024)).toFixed(1)} MB`,
          duration: item.file_data.duration || null,
          comment: item.file_data.comment || '',
          album_name: item.album_name || ''
        }))
        
        console.log(`✅ Gallery data fetched: ${transformedItems.length} items for page ${page}`)
        
        if (append) {
          setGalleryItems(prev => [...prev, ...transformedItems])
          // Smooth scroll animation for new items
          setTimeout(() => {
            const scrollContainer = document.querySelector('.gallery-scroll-container')
            if (scrollContainer) {
              scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth'
              })
            }
          }, 100)
        } else {
          setGalleryItems(transformedItems)
        }
        
        setTotalItems(data.total || transformedItems.length)
        setHasMore(data.hasMore || transformedItems.length === 10)
        setCurrentPage(page)
      } else {
        console.error('❌ Error fetching gallery data:', data.error)
        if (!append) {
          setGalleryItems([])
        }
      }
    } catch (error) {
      console.error('❌ Error fetching gallery data:', error)
      if (!append) {
        setGalleryItems([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return
    
    setUploading(true)
    
    try {
   
      
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
        formData.append('descriptions', `Uploaded on ${new Date().toLocaleDateString()}`)
        formData.append('comments', 'Gallery upload')
      })
      if (album) formData.append('album', album)
      
      const response = await fetch(`/api/projects/slug/${slug}/gallery`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Transform uploaded items to match component format
        const newItems = data.items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type.startsWith('image/') ? 'image' : 'video',
          url: item.url,
          thumbnail: item.thumbnail || item.url,
          description: item.description || '',
          uploadDate: new Date(item.created_at).toLocaleDateString(),
          fileSize: `${(item.size / (1024 * 1024)).toFixed(1)} MB`,
          duration: item.duration || null,
          comment: item.comment || '',
          album_name: albumName
        }))
        
        setGalleryItems(prev => [...newItems, ...prev])
        console.log(`✅ Files uploaded successfully: ${newItems.length} items`)
        toast.success(`Successfully uploaded ${newItems.length} file(s)!`)
        // refresh album view
        setCurrentPage(1)
        fetchGalleryData(1, false)
      } else {
        console.error('❌ Upload error:', data.error)
        toast.error(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Error uploading files:', error)
      toast.error('Error uploading files. Please try again.')
    } finally {
      setUploading(false)
      // Clear the file input
      event.target.value = ''
    }
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const confirmDelete = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const cancelDelete = () => {
    setItemToDelete(null)
    setShowDeleteModal(false)
  }

  const removeItem = async () => {
    if (!itemToDelete) return

    try {
      setDeleting(true)
      console.log('🚀 Deleting gallery item:', itemToDelete.id)
      
      const response = await fetch(`/api/projects/slug/${slug}/gallery?id=${itemToDelete.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGalleryItems(prev => prev.filter(item => item.id !== itemToDelete.id))
        if (selectedItem?.id === itemToDelete.id) {
          setShowModal(false)
          setSelectedItem(null)
        }
        console.log('✅ Gallery item deleted successfully')
        toast.success('Gallery item deleted successfully!')
      } else {
        console.error('❌ Delete error:', data.error)
        toast.error(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Error deleting gallery item:', error)
      toast.error('Error deleting gallery item. Please try again.')
    } finally {
      setDeleting(false)
      setItemToDelete(null)
      setShowDeleteModal(false)
    }
  }

  const getFileIcon = (type) => {
    return type === 'image' ? <FiImage className="text-blue-500" /> : <FiVideo className="text-red-500" />
  }

  const startReplace = (itemId) => {
    setReplacingId(itemId)
    const input = document.getElementById(`replace-input-${itemId}`)
    if (input) input.click()
  }

  const uploadFiles = async (files, albumName, albumTitle) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
        formData.append('descriptions', albumTitle || `Uploaded on ${new Date().toLocaleDateString()}`)
        formData.append('comments', 'Gallery upload')
      })
      if (albumName) formData.append('album', albumName)

      const response = await fetch(`/api/projects/slug/${slug}/gallery`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        const newItems = data.items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type.startsWith('image/') ? 'image' : 'video',
          url: item.url,
          thumbnail: item.thumbnail || item.url,
          description: item.description || '',
          uploadDate: new Date(item.created_at).toLocaleDateString(),
          fileSize: `${(item.size / (1024 * 1024)).toFixed(1)} MB`,
          duration: item.duration || null,
          comment: item.comment || ''
        }))
        setGalleryItems(prev => [...newItems, ...prev])
        toast.success(`Successfully uploaded ${newItems.length} file(s)!`)
        setCurrentPage(1)
        fetchGalleryData(1, false)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('❌ Error uploading files:', error)
      toast.error(`Error uploading files: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleReplaceFile = async (e, item) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      setUploading(true)
      // Delete existing item
      const delRes = await fetch(`/api/projects/slug/${slug}/gallery?id=${item.id}`, { method: 'DELETE' })
      const delData = await delRes.json()
      if (!delRes.ok || !delData.success) throw new Error(delData.error || 'Failed deleting old image')
      // Upload replacement
      await uploadFiles([file], item.album || album, item.description)
      toast.success('Image replaced successfully')
    } catch (err) {
      console.error('❌ Replace error:', err)
      toast.error(`Failed to replace image: ${err.message}`)
    } finally {
      setUploading(false)
      setReplacingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading project gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-w-0 mt-[3em] ">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6">
        <div>
          <h2 className="text-lg !font-semibold text-gray-900 dark:text-white">
            Project Gallery
          </h2>
          <p className="!text-sm text-gray-600 dark:text-gray-400 mt-1">
            Project photos and videos
          </p>
        </div>
        
        {/* Add Album Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAlbumModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white !text-sm !font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="text-lg" />
            <span>Add Album</span>
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="px-6 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">Uploading files...</span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 gallery-scroll-container">
        {galleryItems.length === 0 ? (
          <div className="text-center py-12">
            <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="!text-base !font-medium text-gray-900 dark:text-white mb-2">
              No photos or videos yet
            </h3>
            <p className="!text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload photos and videos to document your project progress
            </p>
            <button
              onClick={() => setShowAlbumModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white !text-sm !font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <FiPlus className="text-lg" />
              <span>Create First Album</span>
            </button>
          </div>
        ) : (
          (() => {
            const groups = galleryItems.reduce((acc, item) => {
              const key = item.album_name || 'Uncategorized'
              if (!acc[key]) acc[key] = []
              acc[key].push(item)
              return acc
            }, {})
            const albumNames = Object.keys(groups)
            return (
            <div className="space-y-10">
              {albumNames.map((groupName) => (
                <div key={groupName}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">{groupName}</h4>
                    <button
                      onClick={() => { setRenameOld(groupName); setRenameNew(groupName); setShowRenameModal(true) }}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-800"
                    >
                      <FiEdit3 />
                      <span>Rename Album</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {groups[groupName].map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleItemClick(item)}
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                      <FiVideo className="text-4xl text-gray-400" />
                    </div>
                  )}
                  
                  {/* File Type Icon */}
                  <div className="absolute top-3 z-[1000] right-3">
                    <div className="text-2xl">
                      {getFileIcon(item.type)}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(item)
                    }}
                    className="absolute top-3 left-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FiX className="text-lg" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startReplace(item.id)
                    }}
                    className="absolute top-3 left-14 p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                  >
                    <FiRefreshCw className="text-lg" />
                  </button>
                  <input id={`replace-input-${item.id}`} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleReplaceFile(e, item)} />

                  {/* Video Duration */}
                  {item.type === 'video' && item.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white !text-xs rounded">
                      {item.duration}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h5 className="!text-sm !font-medium text-gray-900 dark:text-white mb-2 truncate">
                    {item.name}
                  </h5>
                  <p className="!text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between !text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.uploadDate}</span>
                    <span>{item.fileSize}</span>
                  </div>
                </div>
              </div>
                  ))}
                  </div>
                </div>
              ))}
            </div>)
          })()
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="!text-sm text-gray-600 dark:text-gray-400">Loading more items...</span>
            </div>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && galleryItems.length > 0 && (
          <div className="text-center py-8">
            <p className="!text-sm text-gray-500 dark:text-gray-400">
              Showing {galleryItems.length} of {totalItems} items
            </p>
            <p className="!text-xs text-gray-400 dark:text-gray-500 mt-1">
              You've reached the end of the gallery
            </p>
          </div>
        )}
      </div>

      {/* Modal for Item Details */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 overflow-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="!text-lg !font-semibold text-gray-900 dark:text-white">
                {selectedItem.name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    {selectedItem.type === 'image' ? (
                      <img
                        src={selectedItem.url}
                        alt={selectedItem.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <video
                        src={selectedItem.url}
                        controls
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="!text-sm !font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="!text-xs text-gray-600 dark:text-gray-400">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="!text-sm !font-medium text-gray-900 dark:text-white mb-1">Upload Date</h4>
                      <p className="!text-xs text-gray-600 dark:text-gray-400">{selectedItem.uploadDate}</p>
                    </div>
                    <div>
                      <h4 className="!text-sm !font-medium text-gray-900 dark:text-white mb-1">File Size</h4>
                      <p className="!text-xs text-gray-600 dark:text-gray-400">{selectedItem.fileSize}</p>
                    </div>
                    <div>
                      <h4 className="!text-sm !font-medium text-gray-900 dark:text-white mb-1">Type</h4>
                      <p className="!text-xs text-gray-600 dark:text-gray-400 capitalize">{selectedItem.type}</p>
                    </div>
                    {selectedItem.duration && (
                      <div>
                        <h4 className="!text-sm !font-medium text-gray-900 dark:text-white mb-1">Duration</h4>
                        <p className="!text-xs text-gray-600 dark:text-gray-400">{selectedItem.duration}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => window.open(selectedItem.url, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white !text-sm !font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiEye className="text-lg" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => window.open(selectedItem.url, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white !text-sm !font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <FiDownload className="text-lg" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false)
                        confirmDelete(selectedItem)
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white !text-sm !font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FiX className="text-lg" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <FiX className="text-red-600 dark:text-red-400 text-xl" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Gallery Item
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this item?
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {itemToDelete.type === 'image' ? (
                  <img
                    src={itemToDelete.thumbnail}
                    alt={itemToDelete.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <FiVideo className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {itemToDelete.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {itemToDelete.fileSize}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={removeItem}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Album</h3>
              <button onClick={() => setShowAlbumModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Album Name</label>
                <input type="text" value={albumNameInput} onChange={(e)=>setAlbumNameInput(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., Site Visit Oct 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title (optional)</label>
                <input type="text" value={albumTitleInput} onChange={(e)=>setAlbumTitleInput(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., Foundation Pour" />
              </div>
            </div>
            <div 
              className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
              onDragOver={(e)=>e.preventDefault()}
              onDrop={(e)=>{ e.preventDefault(); const dropped = Array.from(e.dataTransfer.files || []); if (dropped.length) setAlbumFiles(prev => [...prev, ...dropped]) }}
            >
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <label htmlFor="album-file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Select files</span>
                  <input id="album-file-upload" name="album-file-upload" type="file" multiple accept="image/*,video/*" onChange={(e)=>{setAlbumFiles(prev => [...prev, ...Array.from(e.target.files)])}} className="sr-only" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Images/Videos up to your storage limits</p>

              {albumFiles.length > 0 && (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Selected {albumFiles.length} file(s)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {albumFiles.map((f, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                        <button
                          onClick={() => setAlbumFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-1 py-0.5 text-[10px] opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 truncate" title={f.name}>{f.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={()=>setShowAlbumModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Close</button>
              <button 
                type="button" 
                disabled={!albumNameInput.trim() || albumFiles.length === 0}
                onClick={()=>{ 
                  const input = document.getElementById('album-file-upload');
                  const filesToSend = input && input.files && input.files.length > 0 ? Array.from(input.files) : albumFiles;
                  setAlbum(albumNameInput); 
                  uploadFiles(filesToSend, albumNameInput, albumTitleInput); 
                  setShowAlbumModal(false) 
                }} 
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${(!albumNameInput.trim() || albumFiles.length===0) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Create Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Album Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rename Album</h3>
              <button onClick={() => setShowRenameModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Name</label>
                <input type="text" value={renameOld} readOnly className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Name</label>
                <input type="text" value={renameNew} onChange={(e)=>setRenameNew(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={()=>setShowRenameModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
              <button 
                type="button" 
                disabled={!renameNew.trim() || renameNew === renameOld}
                onClick={async ()=>{ 
                  try {
                    const res = await fetch(`/api/projects/slug/${slug}/gallery`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'renameAlbum', oldAlbumName: renameOld, newAlbumName: renameNew }) })
                    const data = await res.json()
                    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to rename album')
                    // Update local items
                    setGalleryItems(prev => prev.map(i => (i.album_name === renameOld ? { ...i, album_name: renameNew } : i)))
                    if (album === renameOld) setAlbum(renameNew)
                    toast.success('Album renamed')
                    setShowRenameModal(false)
                  } catch (err) {
                    toast.error(err.message)
                  }
                }} 
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${(!renameNew.trim() || renameNew===renameOld) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectGallery
