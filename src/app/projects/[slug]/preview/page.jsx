'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiMapPin, FiCalendar, FiUser, FiClock, FiDollarSign, FiFileText, FiImage, FiLink, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { motion, useScroll, useTransform } from 'framer-motion'
import LocationMap from '../../../components/Map/LocationMap'
import CircularProgress from '../../../components/CircularProgress'

const ProjectPreviewPage = () => {
  const params = useParams()
  const router = useRouter()
  const { slug } = params
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const [galleryItems, setGalleryItems] = useState([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [albums, setAlbums] = useState([])
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0)
  const [albumPages, setAlbumPages] = useState({}) // Track page for each album
  const [albumHasMore, setAlbumHasMore] = useState({}) // Track if album has more
  const [groupedGalleryItems, setGroupedGalleryItems] = useState({}) // Group by album
  const { scrollYProgress } = useScroll()
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    if (slug) {
      fetchProjectData()
    }
  }, [slug])

  useEffect(() => {
    if (!project) return

    const sections = [
      { id: 'project_info', condition: true },
      { id: 'project_description', condition: project.project_description },
      { id: 'project_details', condition: project.project_details },
      { id: 'project_location', condition: project.project_location },
      { id: 'timeline', condition: true },
      { id: 'stakeholders', condition: true },
      { id: 'linked_projects', condition: project.linked_projects?.length > 0 },
      { id: 'project_gallery', condition: true }
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
      }
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element && section.condition) observer.observe(element)
    })

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id)
        if (element && section.condition) observer.unobserve(element)
      })
    }
  }, [project])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/slug/${slug}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project')
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Project not found')
      }
      
      setProject(data.project)
      // Fetch gallery albums after project is loaded
      if (slug) {
        fetchAlbums()
      }
    } catch (error) {
      console.error('❌ Error fetching project:', error)
      toast.error(`Error loading project: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch unique albums first
  const fetchAlbums = async () => {
    try {
      setLoadingGallery(true)
      const response = await fetch(`/api/projects/slug/${slug}/gallery?limit=1000`)
      const data = await response.json()
      
      if (data.success && data.items) {
        // Get unique album names
        const albumSet = new Set()
        data.items.forEach(item => {
          const albumName = item.album_name || 'Uncategorized'
          albumSet.add(albumName)
        })
        const albumList = Array.from(albumSet)
        setAlbums(albumList)
        
        // Initialize pagination state for each album
        const initialPages = {}
        const initialHasMore = {}
        albumList.forEach(album => {
          initialPages[album] = 0
          initialHasMore[album] = true
        })
        setAlbumPages(initialPages)
        setAlbumHasMore(initialHasMore)
        
        // Start loading first album after state is set
        if (albumList.length > 0) {
          // Use setTimeout to ensure state is updated
          setTimeout(() => {
            fetchAlbumImages(albumList[0], 1, false, albumList)
          }, 100)
        } else {
          setLoadingGallery(false)
        }
      } else {
        setLoadingGallery(false)
      }
    } catch (error) {
      console.error('❌ Error fetching albums:', error)
      setLoadingGallery(false)
    }
  }

  // Fetch images for a specific album with pagination
  const fetchAlbumImages = async (albumName, page = 1, append = false, albumsList = null) => {
    try {
      if (page === 1 && !append) {
        setLoadingGallery(true)
      } else {
        setLoadingMore(true)
      }
      
      const response = await fetch(`/api/projects/slug/${slug}/gallery?page=${page}&limit=10&album=${encodeURIComponent(albumName)}`)
      const data = await response.json()
      
      if (data.success && data.items) {
        // Filter only images and transform data
        const images = data.items
          .filter(item => {
            const fileType = item.file_data?.type || ''
            const fileName = item.file_data?.name || ''
            return fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(fileName)
          })
          .map(item => ({
            id: item.id,
            url: item.file_data?.url || '',
            thumbnail: item.file_data?.thumbnail || item.file_data?.url || '',
            name: item.file_data?.name || 'Image',
            description: item.file_data?.description || '',
            album_name: albumName,
            created_at: item.created_at
          }))
        
        if (append) {
          setGroupedGalleryItems(prev => ({
            ...prev,
            [albumName]: [...(prev[albumName] || []), ...images]
          }))
        } else {
          setGroupedGalleryItems(prev => ({
            ...prev,
            [albumName]: images
          }))
        }
        
        // Update pagination state
        setAlbumPages(prev => ({
          ...prev,
          [albumName]: page
        }))
        setAlbumHasMore(prev => ({
          ...prev,
          [albumName]: data.hasMore && images.length > 0
        }))
      }
    } catch (error) {
      console.error('❌ Error fetching album images:', error)
    } finally {
      setLoadingGallery(false)
      setLoadingMore(false)
    }
  }

  // Load more images for current album or move to next album
  const loadMoreGallery = () => {
    if (albums.length === 0) return
    
    const currentAlbum = albums[currentAlbumIndex]
    if (!currentAlbum) return
    
    const currentPage = albumPages[currentAlbum] || 0
    const hasMore = albumHasMore[currentAlbum] !== false
    
    if (hasMore && currentAlbum) {
      // Load more for current album
      fetchAlbumImages(currentAlbum, currentPage + 1, true)
    } else if (currentAlbumIndex < albums.length - 1) {
      // Move to next album
      const nextAlbum = albums[currentAlbumIndex + 1]
      if (nextAlbum) {
        setCurrentAlbumIndex(currentAlbumIndex + 1)
        if (!groupedGalleryItems[nextAlbum] || groupedGalleryItems[nextAlbum].length === 0) {
          fetchAlbumImages(nextAlbum, 1, false)
        }
      }
    }
  }

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || loadingGallery) return
      
      const scrollContainer = window
      const scrollTop = scrollContainer.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Load more when near bottom (within 200px)
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMoreGallery()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [albums, currentAlbumIndex, albumPages, albumHasMore, loadingMore, loadingGallery, groupedGalleryItems])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'design':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      case 'yet to start':
      case 'yet-to-start':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'on hold':
      case 'on-hold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'abandoned':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getLinkStyle = (sectionId) => {
    return `shrink-0 px-4 py-2 rounded-lg transition-colors duration-300 cursor-pointer text-sm ${
      activeSection === sectionId 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const parseCoordinates = (gpsData) => {
    if (!gpsData) return null
    try {
      if (typeof gpsData === 'object' && gpsData !== null) {
        const lat = parseFloat(gpsData.lat)
        const lng = parseFloat(gpsData.lng)
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng]
        }
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error)
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex w-full h-full items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Project not found</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const coordinates = parseCoordinates(project.project_location?.gpsCoordinates)

  return (
    <div className="relative w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-8 min-h-screen p-4 pt-8">
      {/* Sticky Sidebar Navigation */}
      <div className="relative w-full lg:w-[20%] lg:sticky lg:top-24 self-start h-fit z-10 bg-gray-50 dark:bg-gray-900 lg:bg-transparent pb-4 lg:pb-0" style={{ alignSelf: 'flex-start', position: 'sticky', top: '6rem' }}>
        {/* Mobile line tracker */}
        <motion.div 
          className="absolute bottom-0 w-full h-[2px] bg-blue-600 lg:hidden"
          style={{ width: lineWidth }}
        />
        
        {/* Desktop line tracker */}
        <motion.div 
          className="absolute top-0 bottom-0 left-0 w-[2px] bg-blue-600 hidden lg:block"
          style={{ height: lineHeight }}
        />

        <div className="flex lg:flex-col gap-2 whitespace-nowrap w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          <button 
            onClick={() => scrollToSection('project_info')} 
            className={getLinkStyle('project_info')}
          >
            Project Info
          </button>
          {project.project_description && (
            <button 
              onClick={() => scrollToSection('project_description')} 
              className={getLinkStyle('project_description')}
            >
              Description
            </button>
          )}
          {project.project_details && (
            <button 
              onClick={() => scrollToSection('project_details')} 
              className={getLinkStyle('project_details')}
            >
              Details
            </button>
          )}
          {project.project_location && (
            <button 
              onClick={() => scrollToSection('project_location')} 
              className={getLinkStyle('project_location')}
            >
              Location
            </button>
          )}
          <button 
            onClick={() => scrollToSection('timeline')} 
            className={getLinkStyle('timeline')}
          >
            Timeline
          </button>
          <button 
            onClick={() => scrollToSection('stakeholders')} 
            className={getLinkStyle('stakeholders')}
          >
            Stakeholders
          </button>
          {project.linked_projects?.length > 0 && (
            <button 
              onClick={() => scrollToSection('linked_projects')} 
              className={getLinkStyle('linked_projects')}
            >
              Linked Projects
            </button>
          )}
          <button 
            onClick={() => scrollToSection('project_gallery')} 
            className={getLinkStyle('project_gallery')}
          >
            Gallery
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full lg:w-[80%] flex flex-col gap-8 pb-12 min-w-0">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {project.project_name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {project.project_location?.mmda && project.project_location?.region && (
              <div className="flex items-center gap-2">
                <FiMapPin className="text-blue-600" />
                <span>{project.project_location.mmda}, {project.project_location.region}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                {project.project_status || 'N/A'}
              </span>
            </div>
            {project.project_priority && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(project.project_priority)}`}>
                  {project.project_priority}
                </span>
              </div>
            )}
          </div>

          {/* Cover Image */}
          {project.project_cover_image?.url && (
            <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
              <img
                src={project.project_cover_image.url}
                alt={project.project_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Project Information Section */}
        <div className="space-y-6 border-l-2 border-blue-500/20 pl-6" id="project_info">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Project Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Project ID</label>
              <p className="text-sm text-gray-900 dark:text-white font-mono">{project.project_id || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Institution Name</label>
              <p className="text-sm text-gray-900 dark:text-white">{project.institution_name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Contract Date</label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.contract_date)}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
              <p className="text-sm text-gray-900 dark:text-white">{project.project_duration || 'N/A'}</p>
            </div>
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Planned Progress
              </label>
              <CircularProgress
                value={project.planned_progress !== null && project.planned_progress !== undefined 
                  ? Number(project.planned_progress) 
                  : 0}
                size={140}
                strokeWidth={10}
                color="#8B5CF6"
                label={project.planned_progress !== null && project.planned_progress !== undefined
                  ? `${Number(project.planned_progress).toFixed(1)}%`
                  : 'N/A'}
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Cumulative Progress
              </label>
              <CircularProgress
                value={project.cumulative_progress !== null && project.cumulative_progress !== undefined 
                  ? Number(project.cumulative_progress) 
                  : 0}
                size={140}
                strokeWidth={10}
                color="#3B82F6"
                label={project.cumulative_progress !== null && project.cumulative_progress !== undefined
                  ? `${Number(project.cumulative_progress).toFixed(1)}%`
                  : 'N/A'}
              />
            </div>
          </div>

          {/* Project Types & Categories */}
          <div className="space-y-4">
            {project.project_types?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Project Types</label>
                <div className="flex flex-wrap gap-2">
                  {project.project_types.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm rounded-full">
                      {type.projectType || type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.project_categories?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Project Categories</label>
                <div className="flex flex-wrap gap-2">
                  {project.project_categories.map((cat, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-sm rounded-full">
                      {cat.category || cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.building_types?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Structures</label>
                <div className="space-y-3">
                  {project.building_types.map((type, index) => (
                    <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-800 dark:text-green-300 text-sm">
                            {type.buildingType || type}
                          </span>
                        </div>
                        {type.code && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Code:</span>
                            <span className="font-mono">{type.code}</span>
                          </div>
                        )}
                        {type.category && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Category:</span>
                            <span>{type.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {project.project_services?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Project Services</label>
                <div className="flex flex-wrap gap-2">
                  {project.project_services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-sm rounded-full">
                      {service.serviceName || service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Description Section */}
        {project.project_description && (
          <div className="space-y-4 border-l-2 border-orange-500/20 pl-6" id="project_description">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Project Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {project.project_description}
            </p>
          </div>
        )}

        {/* Project Details Section */}
        {project.project_details && (
          <div className="space-y-4 border-l-2 border-purple-500/20 pl-6" id="project_details">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Project Details
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {project.project_details}
            </p>
          </div>
        )}

        {/* Project Location Section */}
        {project.project_location && (
          <div className="space-y-4 border-l-2 border-green-500/20 pl-6" id="project_location">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Project Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {project.project_location.country && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="text-sm text-gray-900 dark:text-white">{project.project_location.country}</p>
                </div>
              )}
              {project.project_location.region && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Region</label>
                  <p className="text-sm text-gray-900 dark:text-white">{project.project_location.region}</p>
                </div>
              )}
              {project.project_location.mmda && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">MMDA</label>
                  <p className="text-sm text-gray-900 dark:text-white">{project.project_location.mmda}</p>
                </div>
              )}
              {project.project_location.city_town && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">City/Town</label>
                  <p className="text-sm text-gray-900 dark:text-white">{project.project_location.city_town}</p>
                </div>
              )}
              {project.project_location.address && (
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="text-sm text-gray-900 dark:text-white">{project.project_location.address}</p>
                </div>
              )}
              {coordinates && (
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">GPS Coordinates</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {project.project_location.gpsCoordinates?.lat}, {project.project_location.gpsCoordinates?.lng}
                  </p>
                </div>
              )}
            </div>

            {/* Map Display */}
            {coordinates && (
              <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg">
                <LocationMap 
                  coordinates={coordinates}
                  zoom={15}
                  height="100%"
                />
              </div>
            )}
          </div>
        )}

        {/* Timeline Section */}
        <div className="space-y-4 border-l-2 border-red-500/20 pl-6" id="timeline">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Timeline
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                Project Start Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.project_start_date)}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                Project Completion Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.project_end_date)}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                Site Possession Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.site_possession_date)}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                Handing Over Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.handing_over_date)}</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                Revised Date
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{formatDate(project.revised_date)}</p>
            </div>
          </div>
        </div>

        {/* Stakeholders Section */}
        <div className="space-y-6 border-l-2 border-teal-500/20 pl-6" id="stakeholders">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            Stakeholders
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.project_clients?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  Clients
                </label>
                <div className="space-y-1">
                  {project.project_clients.map((client, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {client.clientName || client}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {project.funding_agencies?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiDollarSign className="text-green-600" />
                  Funding Agencies
                </label>
                <div className="space-y-1">
                  {project.funding_agencies.map((agency, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {agency.agencyName || agency}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {project.contractors?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiUser className="text-purple-600" />
                  Contractors
                </label>
                <div className="space-y-1">
                  {project.contractors.map((contractor, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {contractor.fullName || contractor}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {project.clerk_of_works?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiUser className="text-orange-600" />
                  Clerk of Works
                </label>
                <div className="space-y-1">
                  {project.clerk_of_works.map((cow, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {cow.fullName || cow}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {project.project_managers?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiUser className="text-indigo-600" />
                  Project Managers
                </label>
                <div className="space-y-1">
                  {project.project_managers.map((manager, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {manager.managerName || manager}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {project.project_coordinators?.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <FiUser className="text-pink-600" />
                  Project Coordinators
                </label>
                <div className="space-y-1">
                  {project.project_coordinators.map((coord, index) => (
                    <p key={index} className="text-sm text-gray-900 dark:text-white">
                      {coord.fullName || coord}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Linked Projects Section */}
        {project.linked_projects && project.linked_projects.length > 0 && (
          <div className="space-y-4 border-l-2 border-indigo-500/20 pl-6" id="linked_projects">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Linked Projects
            </h2>
            <div className="space-y-2">
              {project.linked_projects.map((linkedProject, index) => {
                const projectName = linkedProject?.project_name || linkedProject?.projectName || linkedProject
                const projectSlug = linkedProject?.project_slug || linkedProject?.slug
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors ${
                      projectSlug ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                    }`}
                    onClick={() => {
                      if (projectSlug) {
                        router.push(`/projects/${projectSlug}/preview`)
                      }
                    }}
                  >
                    <FiLink className="text-indigo-600" />
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {projectName || 'Unknown Project'}
                    </p>
                    {projectSlug && (
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">View →</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Special Comments */}
        {project.project_special_comment && (
          <div className="space-y-4 border-l-2 border-yellow-500/20 pl-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Special Comments
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {project.project_special_comment}
            </p>
          </div>
        )}

        {/* Project Gallery Section */}
        <div className="space-y-8 border-l-2 border-pink-500/20 pl-6 w-full" id="project_gallery">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              Project Gallery
            </h2>
            <br/>
            
            {loadingGallery && albums.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading gallery...</p>
                </div>
              </div>
            ) : albums.length > 0 ? (
              <div className="space-y-12 w-full">
                {albums.map((albumName) => {
                  const albumImages = groupedGalleryItems[albumName] || []
                  if (albumImages.length === 0 && albumPages[albumName] === 0) return null
                  
                  return (
                    <div key={albumName} className="space-y-4 w-full">
                      {/* Album Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {albumName}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({albumImages.length} {albumImages.length === 1 ? 'image' : 'images'})
                        </span>
                      </div>
                      
                      {/* Album Images Masonry Grid */}
                      {albumImages.length > 0 ? (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {albumImages.map((item) => (
                            <div
                              key={item.id}
                              className="cursor-pointer group"
                              onClick={() => {
                                setSelectedImage(item)
                                setShowImageModal(true)
                              }}
                            >
                              <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                <img
                                  src={item.thumbnail || item.url}
                                  alt={item.description || item.name}
                                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                                {item.description && (
                                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-sm line-clamp-2">{item.description}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                        </div>
                      )}
                      
                      {/* Loading More Indicator for Album */}
                      {loadingMore && albumHasMore[albumName] && currentAlbumIndex === albums.indexOf(albumName) && (
                        <div className="flex justify-center py-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                            <span>Loading more images...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Loading More Indicator for Next Album */}
                {loadingGallery && currentAlbumIndex < albums.length - 1 && (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading next album...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No images in gallery yet</p>
              </div>
            )}
          </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.description || selectedImage.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {(selectedImage.description || selectedImage.name) && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 rounded-lg p-4 text-white max-w-2xl mx-auto">
                <h3 className="font-semibold mb-1">{selectedImage.name}</h3>
                {selectedImage.description && (
                  <p className="text-sm opacity-90">{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectPreviewPage
