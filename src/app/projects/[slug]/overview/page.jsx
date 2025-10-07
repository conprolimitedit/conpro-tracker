'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiSave } from 'react-icons/fi'
import { toast } from 'react-toastify'
import MultiSelectDropdown from '../../../components/MultiSelectDropdown'
import EnhancedLocationSelector from '../../../components/EnhancedLocationSelector'
import { useAuth } from '../../../contexts/AuthContext'
// import { supabase } from '../../../lib/supabaseClient' // Not needed for file upload
// Remove dummy data import - we'll fetch real data from APIs

const ProjectOverviewPage = () => {
  const params = useParams()
  const router = useRouter()
  const { slug } = params
  const isNewProject = slug === 'addNewProject'
  const fileInputRef = useRef(null)
  const { user } = useAuth()
  
  // Check if user can edit projects (admin or projectManager)
  const canEditProjects = user?.userRole === 'admin' || user?.userRole === 'projectManager'
  
  const [formData, setFormData] = useState({
    projectName: '',
    coverImage: null,
    location: {
      country: '',
      region: '',
      city: '',
      town: '',
      gpsCoordinates: { lat: '', lng: '' },
      address: '',
      additional_info: ''
    },
    clients: [],
    fundingAgencies: [],
    projectStartDate: '',
    projectCompletionDate: '',
    slug: '',
    projectContractor: [],
    buildingTypes: [],
    projectServices: [],
    projectDescription: '',
    projectStatus: '',
    projectPriority: 'medium',
    projectDetails: '',
    projectCOW: [],
    projectManagers: [], // Added project managers
    projectCoordinators: [], // Added project coordinators
    handingOverDate: '',
    contractDate: '',
    plannedProgress: '',
    cumulativeProgress: '',
    sitePossessionDate: '',
    duration: '',
    specialComments: '',
    linkedProjects: [] // Added linkedProjects state
  })


  const [loading, setLoading] = useState(!isNewProject)
  const [saving, setSaving] = useState(false)
  
  // Content data states
  const [clients, setClients] = useState([])
  const [contractors, setContractors] = useState([])
  const [buildingTypes, setBuildingTypes] = useState([])
  const [projectServices, setProjectServices] = useState([])
  const [clerkOfWorks, setClerkOfWorks] = useState([])
  const [fundingAgencies, setFundingAgencies] = useState([])
  const [projectManagers, setProjectManagers] = useState([])
  const [projectCoordinators, setProjectCoordinators] = useState([])
  const [projects, setProjects] = useState([])
  const [contentLoading, setContentLoading] = useState(true)
  const [gpsUserEdited, setGpsUserEdited] = useState(false)

  useEffect(() => {
    // Check access for new project creation
    if (isNewProject && !canEditProjects) {
      toast.error('You do not have permission to create new projects. Only admins and project managers can create projects.', {
        position: "top-right",
        autoClose: 5000,
      })
      router.push('/projects')
      return
    }

    // Always fetch content data
    fetchContentData()
    
    // Fetch project data only for existing projects
    if (!isNewProject && slug !== 'addNewProject') {
      fetchProjectData()
    }
  }, [slug, isNewProject, canEditProjects, router])

  const fetchContentData = async () => {
    try {
      setContentLoading(true)
      
      // Fetch all content data in parallel
      const [
        clientsRes,
        contractorsRes,
        buildingTypesRes,
        servicesRes,
        clerkOfWorksRes,
        fundingAgenciesRes,
        projectManagersRes,
        projectCoordinatorsRes,
        projectsRes
      ] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/contractors'),
        fetch('/api/building-types'),
        fetch('/api/services'),
        fetch('/api/clerk-of-works'),
        fetch('/api/funding-agencies'),
        fetch('/api/project-managers'),
        fetch('/api/project-coordinators'),
        fetch('/api/projects')
      ])

      // Parse all responses
      const [
        clientsData,
        contractorsData,
        buildingTypesData,
        servicesData,
        clerkOfWorksData,
        fundingAgenciesData,
        projectManagersData,
        projectCoordinatorsData,
        projectsData
      ] = await Promise.all([
        clientsRes.json(),
        contractorsRes.json(),
        buildingTypesRes.json(),
        servicesRes.json(),
        clerkOfWorksRes.json(),
        fundingAgenciesRes.json(),
        projectManagersRes.json(),
        projectCoordinatorsRes.json(),
        projectsRes.json()
      ])

      // Set the data
      if (clientsData.success) setClients(clientsData.clients || [])
      if (contractorsData.success) setContractors(contractorsData.contractors || [])
      if (buildingTypesData.success) setBuildingTypes(buildingTypesData.buildingTypes || [])
      if (servicesData.success) setProjectServices(servicesData.services || [])
      if (clerkOfWorksData.success) setClerkOfWorks(clerkOfWorksData.clerkOfWorks || [])
      if (fundingAgenciesData.success) setFundingAgencies(fundingAgenciesData.fundingAgencies || [])
      if (projectManagersData.success) setProjectManagers(projectManagersData.projectManagers || [])
      if (projectCoordinatorsData.success) setProjectCoordinators(projectCoordinatorsData.projectCoordinators || [])
      if (projectsData.success) setProjects(projectsData.projects || [])
      
    } catch (error) {
      console.error('❌ Error fetching content data:', error)
    } finally {
      setContentLoading(false)
    }
  }

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
      
      const project = data.project
      
      // Transform the project data to match the form structure
      const transformedData = {
        projectName: project.project_name || '',
        coverImage: project.project_cover_image?.url || null,
        location: {
          country: project.project_location?.country || '',
          region: project.project_location?.region || '',
          city: project.project_location?.city || '',
          town: project.project_location?.town || '',
          gpsCoordinates: project.project_location?.gpsCoordinates || { lat: '', lng: '' },
          address: project.project_location?.address || '',
          additional_info: project.project_location?.additional_info || ''
        },
        clients: project.project_clients || [],
        fundingAgencies: project.funding_agencies || [],
        projectStartDate: project.project_start_date || '',
        projectCompletionDate: project.project_end_date || '',
        slug: project.project_slug || '',
        projectContractor: project.contractors || [],
        buildingTypes: project.building_types || [],
        projectServices: project.project_services || [],
        projectDescription: project.project_description || '',
        projectStatus: project.project_status || '',
        projectPriority: project.project_priority || 'medium',
        projectDetails: project.project_details || '',
        projectCOW: project.clerk_of_works || [],
        projectManagers: project.project_managers || [],
        projectCoordinators: project.project_coordinators || [],
        handingOverDate: project.handing_over_date || '',
        contractDate: project.contract_date || '',
        plannedProgress: (project.planned_progress ?? '')?.toString(),
        cumulativeProgress: (project.cumulative_progress ?? '')?.toString(),
        sitePossessionDate: project.site_possession_date || '',
        duration: project.project_duration || '',
        specialComments: project.project_special_comment || '',
        linkedProjects: project.linked_projects || [],
        revisedDate: project.revised_date || ''
      }
      
   
      setFormData(transformedData)
      setGpsUserEdited(false)
    } catch (error) {
      console.error('❌ Error fetching project:', error)
      toast.error(`Error loading project: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-generate slug when project name changes
    if (name === 'projectName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim('-') // Remove leading/trailing hyphens
      
      setFormData(prev => ({
        ...prev,
        slug: slug
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.')
        return
      }
      
      setFormData(prev => ({
        ...prev,
        coverImage: file
      }))
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, coverImage: null }))
    // Clear the file input value using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Use useCallback to prevent infinite loops
  const handleLocationChange = useCallback((newLocation) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...newLocation,
        gpsCoordinates: gpsUserEdited
          ? (prev.location?.gpsCoordinates || { lat: '', lng: '' })
          : (newLocation.gpsCoordinates !== undefined ? newLocation.gpsCoordinates : (prev.location?.gpsCoordinates || { lat: '', lng: '' }))
      }
    }))
  }, [gpsUserEdited])

  const handleClientsChange = useCallback((clients) => {
    setFormData(prev => ({
      ...prev,
      clients
    }))
  }, [])

  const handleContractorsChange = useCallback((contractors) => {
    setFormData(prev => ({
      ...prev,
      projectContractor: contractors
    }))
  }, [])

  const handleBuildingTypesChange = useCallback((buildingTypes) => {
    setFormData(prev => ({
      ...prev,
      buildingTypes
    }))
  }, [])

  const handleProjectServicesChange = useCallback((services) => {
    setFormData(prev => ({
      ...prev,
      projectServices: services
    }))
  }, [])

  const handleClerkOfWorksChange = useCallback((cow) => {
    setFormData(prev => ({
      ...prev,
      projectCOW: cow
    }))
  }, [])

  const handleProjectManagersChange = useCallback((managers) => {
    setFormData(prev => ({
      ...prev,
      projectManagers: managers
    }))
  }, [])

  const handleProjectCoordinatorsChange = useCallback((coordinators) => {
    setFormData(prev => ({
      ...prev,
      projectCoordinators: coordinators
    }))
  }, [])

  const handleFundingAgenciesChange = useCallback((agencies) => {
    setFormData(prev => ({
      ...prev,
      fundingAgencies: agencies
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Validate required fields
      const requiredFields = ['projectName', 'slug']
      const missingFields = requiredFields.filter(field => !formData[field])
      
      // Validate location fields
      const locationFields = ['country', 'region', 'city']
      const missingLocationFields = locationFields.filter(field => !formData.location[field])
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
        setSaving(false)
        return
      }
      
      if (missingLocationFields.length > 0) {
        toast.error(`Please fill in required location fields: ${missingLocationFields.join(', ')}`)
        setSaving(false)
        return
      }
      
      // Prepare location data with country name instead of code
      const locationData = {
        country: formData.location.country, // This should be the full country name
        region: formData.location.region,
        city: formData.location.city,
        town: formData.location.town,
        gpsCoordinates: formData.location.gpsCoordinates,
        address: formData.location.address,
        additional_info: formData.location.additional_info
      }
      
      // Prepare data for API - using IDs for all multi-select fields
      const projectData = {
        project_name: formData.projectName,
        project_slug: formData.slug,
        contract_date: formData.contractDate,
        project_priority: formData.projectPriority,
        // project_cover_image will be handled separately in FormData
        project_location: locationData,
        project_clients: formData.clients.map(client => client.id || client), // Use ID
        funding_agencies: formData.fundingAgencies.map(agency => agency.id || agency), // Use ID
        contractors: formData.projectContractor.map(contractor => contractor.id || contractor), // Use ID
        clerk_of_works: formData.projectCOW.map(cow => cow.id || cow), // Use ID
        project_coordinators: formData.projectCoordinators.map(coord => coord.id || coord), // Use ID
        project_managers: formData.projectManagers.map(manager => manager.id || manager), // Use ID
        building_types: formData.buildingTypes.map(type => type.id || type), // Use ID
        project_services: formData.projectServices.map(service => service.id || service), // Use ID
        project_status: formData.projectStatus,
        project_start_date: formData.projectStartDate,
        project_end_date: formData.projectCompletionDate,
        site_possession_date: formData.sitePossessionDate,
        handing_over_date: formData.handingOverDate,
        revised_date: formData.revisedDate,
        linked_projects: formData.linkedProjects.map(project => project.id || project), // Use ID
        project_description: formData.projectDescription,
        project_details: formData.projectDetails,
        project_special_comment: formData.specialComments,
        planned_progress: formData.plannedProgress ? parseFloat(formData.plannedProgress) : 0,
        cumulative_progress: formData.cumulativeProgress ? parseFloat(formData.cumulativeProgress) : 0,
        project_duration: formData.duration,
        project_completion_percentage: 0 // Start at 0%
      }
      
      // Send data to API for processing (including image upload)
      const endpoint = isNewProject ? '/api/projects' : `/api/projects/slug/${slug}`
      const method = isNewProject ? 'POST' : 'PUT'
      
      let response
      if (formData.coverImage && typeof formData.coverImage !== 'string') {
        // Use FormData when there's an image file
        const formDataToSend = new FormData()
        formDataToSend.append('projectData', JSON.stringify(projectData))
        if (formData.coverImage) {
          formDataToSend.append('coverImage', formData.coverImage)
        }
        
        response = await fetch(endpoint, {
          method,
          body: formDataToSend
        })
      } else {
        // Use JSON when no image file
        response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        })
      }
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project')
      }
      
      // Show success message
      toast.success(isNewProject ? 'Project created successfully!' : 'Project updated successfully!')
      
      // Redirect to project page if it's a new project
      if (isNewProject && result.project) {
        router.push(`/projects/${result.project.project_slug}/overview`)
      }
      
    } catch (error) {
      console.error('❌ Error saving project:', error)
      toast.error(`Error saving project: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || contentLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">
            {loading ? 'Loading project...' : 'Loading content data...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="flex mt-[2em] justify-between items-center mb-6 px-6">
        <h2 className="  font-semibold text-gray-900 dark:text-white">
          {isNewProject ? 'Create New Project' : 'Edit Project'} - Overview
        </h2>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6">
        <form onSubmit={handleSubmit} className="space-y-6 pb-28 max-w-none">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Basic Information
            </h5>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Project Name *
                 </label>
                 <input
                   type="text"
                   name="projectName"
                   value={formData.projectName}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Slug *
                 </label>
                 <input
                   type="text"
                   name="slug"
                   value={formData.slug}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                   readOnly
                 />
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contract Date
                </label>
                <input
                  type="date"
                  name="contractDate"
                  value={formData.contractDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Project Priority
                 </label>
                 <select
                   name="projectPriority"
                   value={formData.projectPriority}
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

             {/* Cover Image - Full Width */}
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Cover Image
               </label>
               <div className="space-y-3">
                 {/* File Input */}
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   onChange={handleFileChange}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   id="coverImageInput"
                 />
                 
                 
                 {/* Image Preview */}
                 {formData.coverImage && (
                   <div className="relative w-full max-w-xs mx-auto">
                       <img
                         src={typeof formData.coverImage === 'string' ? formData.coverImage : URL.createObjectURL(formData.coverImage)}
                         alt="Cover Image Preview"
                         className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                       />
                       <div className="mt-2 text-center">
                         <p className="text-xs text-gray-500 dark:text-gray-400">
                           {typeof formData.coverImage === 'string' 
                             ? 'Current Image' 
                             : `Selected: ${formData.coverImage.name}`
                           }
                         </p>
                         <p className="text-xs text-gray-400 dark:text-gray-500">
                           {typeof formData.coverImage === 'string' 
                             ? '' 
                             : `Size: ${(formData.coverImage.size / 1024 / 1024).toFixed(2)} MB`
                           }
                         </p>
                     </div>
                     
                                            {/* Remove Image Button */}
                       <button
                         type="button"
                         onClick={handleRemoveImage}
                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                         title="Remove image"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                       </button>
                   </div>
                 )}
                 
                 {/* Placeholder when no image */}
                 {!formData.coverImage && (
                   <div className="w-full max-w-xs mx-auto">
                     <div 
                       className="w-full h-48 bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                       onClick={() => fileInputRef.current?.click()}
                     >
                       <div className="text-center">
                         <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                           <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                         </svg>
                         <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                           No image selected
                         </p>
                         <p className="text-xs text-gray-400 dark:text-gray-500">
                           Click to upload an image
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Location Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Project Location
            </h5>
            
            <EnhancedLocationSelector
              location={formData.location}
              onLocationChange={handleLocationChange}
            />


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange({ ...formData.location, address: e.target.value })}
                  placeholder="GPS or physical address"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Info
                </label>
                <input
                  type="text"
                  name="additional_info"
                  value={formData.location.additional_info}
                  onChange={(e) => handleLocationChange({ ...formData.location, additional_info: e.target.value })}
                  placeholder="Any notes about this location"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Stakeholders Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Stakeholders
            </h5>
            <div className="space-y-4">
              {/* Clients and Funding Agency in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clients
                  </label>
                  <MultiSelectDropdown
                    options={clients}
                    selectedItems={formData.clients}
                    onSelectionChange={handleClientsChange}
                    placeholder="Select clients..."
                    searchPlaceholder="Search clients..."
                    nameField="clientName"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Funding Agencies
                  </label>
                  <MultiSelectDropdown
                    options={fundingAgencies}
                    selectedItems={formData.fundingAgencies}
                    onSelectionChange={handleFundingAgenciesChange}
                    placeholder="Select funding agencies..."
                    searchPlaceholder="Search funding agencies..."
                    nameField="agencyName"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Contractors
                </label>
                <MultiSelectDropdown
                  options={contractors}
                  selectedItems={formData.projectContractor}
                  onSelectionChange={handleContractorsChange}
                  placeholder="Select contractors..."
                  searchPlaceholder="Search contractors..."
                  nameField="fullName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clerk of Works
                </label>
                <MultiSelectDropdown
                  options={clerkOfWorks}
                  selectedItems={formData.projectCOW}
                  onSelectionChange={handleClerkOfWorksChange}
                  placeholder="Select clerk of works..."
                  searchPlaceholder="Search clerk of works..."
                  nameField="fullName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Managers
                </label>
                <MultiSelectDropdown
                  options={projectManagers}
                  selectedItems={formData.projectManagers}
                  onSelectionChange={handleProjectManagersChange}
                  placeholder="Select project managers..."
                  searchPlaceholder="Search project managers..."
                  nameField="managerName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Coordinators
                </label>
                <MultiSelectDropdown
                  options={projectCoordinators}
                  selectedItems={formData.projectCoordinators}
                  onSelectionChange={handleProjectCoordinatorsChange}
                  placeholder="Select project coordinators..."
                  searchPlaceholder="Search project coordinators..."
                  nameField="fullName"
                />
              </div>
            </div>
          </div>

          {/* Project Details Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              Project Details
            </h5>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building Types
                </label>
                <MultiSelectDropdown
                  options={buildingTypes}
                  selectedItems={formData.buildingTypes}
                  onSelectionChange={handleBuildingTypesChange}
                  placeholder="Select building types..."
                  searchPlaceholder="Search building types..."
                  nameField="buildingType"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Services
                </label>
                <MultiSelectDropdown
                  options={projectServices}
                  selectedItems={formData.projectServices}
                  onSelectionChange={handleProjectServicesChange}
                  placeholder="Select project services..."
                  searchPlaceholder="Search project services..."
                  nameField="serviceName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (text)
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 12 months"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Status
                  </label>
                  <select
                    name="projectStatus"
                    value={formData.projectStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select Status</option>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="on-hold">Terminated</option>
                    <option value="on-hold">Abandoned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              Timeline
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Start Date
                </label>
                <input
                  type="date"
                  name="projectStartDate"
                  value={formData.projectStartDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Completion Date
                </label>
                <input
                  type="date"
                  name="projectCompletionDate"
                  value={formData.projectCompletionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Possession Date
                </label>
                <input
                  type="date"
                  name="sitePossessionDate"
                  value={formData.sitePossessionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Handing Over Date
                </label>
                <input
                  type="date"
                  name="handingOverDate"
                  value={formData.handingOverDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Revised Date
                </label>
                <input
                  type="date"
                  name="revisedDate"
                  value={formData.revisedDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>



 {/* Linked Projects Section */}
 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
              Linked Projects
            </h5>
            <MultiSelectDropdown
              options={projects}
              selectedItems={formData.linkedProjects || []}
              onSelectionChange={(selectedProjects) => setFormData(prev => ({ ...prev, linkedProjects: selectedProjects }))}
              placeholder="Select linked projects..."
              searchPlaceholder="Search projects..."
              nameField="project_name"
            />
          </div>



          {/* Description Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
              Description & Comments
            </h5>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planned Progress (%)
                  </label>
                  <input
                    type="number"
                    name="plannedProgress"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.plannedProgress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cumulative Progress (%)
                  </label>
                  <input
                    type="number"
                    name="cumulativeProgress"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.cumulativeProgress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Description
                </label>
                <textarea
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Details
                </label>
                <textarea
                  name="projectDetails"
                  value={formData.projectDetails}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Comments
                </label>
                <textarea
                  name="specialComments"
                  value={formData.specialComments}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add any special comments or notes about this project..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

         


        </form>
      </div>

      {/* Fixed Submit Button - Only visible for users who can edit projects */}
      {canEditProjects && (
        <div className="fixed  w-full md:w-[75vw]  bottom-2 border-t  border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mt-auto z-10">
          <div className="flex justify-center">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FiSave className="text-lg" />
              <span>{saving ? 'Saving...' : (isNewProject ? 'Create Project' : 'Update Project')}</span>
            </button>
          </div>
        </div>
      )}
      {/* Fullscreen Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isNewProject ? 'Creating Project...' : 'Updating Project...'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while your changes are being saved
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProjectOverviewPage 