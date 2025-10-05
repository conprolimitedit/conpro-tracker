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
  FiPlus
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
      
      const response = await fetch(`/api/projects/slug/${slug}/gallery?page=${page}&limit=10`)
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
          comment: item.file_data.comment || ''
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
          comment: item.comment || ''
        }))
        
        setGalleryItems(prev => [...newItems, ...prev])
        console.log(`✅ Files uploaded successfully: ${newItems.length} items`)
        toast.success(`Successfully uploaded ${newItems.length} file(s)!`)
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
    <div className="h-full flex flex-col min-w-0 mt-[3em] relative">

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
        
        {/* Upload Button */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="file-upload"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white !text-sm !font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <FiPlus className="text-lg" />
            <span>Add Photos/Videos</span>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
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
            <label
              htmlFor="file-upload-empty"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white !text-sm !font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <FiPlus className="text-lg" />
              <span>Upload First File</span>
              <input
                id="file-upload-empty"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryItems.map((item) => (
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
                  <div className="absolute top-3 right-3">
                    <div className="text-2xl">
                      {getFileIcon(item.type)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(item)
                    }}
                    className="absolute top-3 left-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FiX className="text-lg" />
                  </button>

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
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 p-4 overflow-hidden">
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
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    </div>
  )
}

export default ProjectGallery
