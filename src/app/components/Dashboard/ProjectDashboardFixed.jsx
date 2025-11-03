'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FiMapPin, FiCalendar, FiUser, FiClock, FiEye, FiSearch, FiFilter, FiDollarSign, FiMap, FiImage, FiList, FiChevronDown, FiChevronRight, FiPlus, FiEdit } from 'react-icons/fi'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import ProjectMap from '../Map/ProjectMap'

import LocationSearchDropdown from '../LocationSearchDropdown'
import ProjectSearchDropdown from '../Projects/ProjectSearchDropdown'
import StructureSearchDropdown from '../StructureSearchDropdown'
import ProjectList from '../Projects/ProjectList'
import { MdCancel } from "react-icons/md";
import { useAuth } from '../../contexts/AuthContext'

const ProjectDashboardFixed = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Check if user can edit projects (admin or projectManager)
  const canEditProjects = user?.userRole === 'admin' || user?.userRole === 'projectManager'
  
  const [selectedProject, setSelectedProject] = useState(null)
  const [expandedProject, setExpandedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [filtering, setFiltering] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allProjects, setAllProjects] = useState([])
  const [displayedProjects, setDisplayedProjects] = useState([])
  const itemsPerPage = 10
  
  // Content management data for filters (now using data directly from projects)
  const [locations, setLocations] = useState({
    countries: [],
    regions: [],
    mmdas: [],
    city_towns: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  // Applied vs Draft filter state
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [draftSearchTerm, setDraftSearchTerm] = useState('')
  const [draftSelectedLocation, setDraftSelectedLocation] = useState(null)
  const [totalProjectsCount, setTotalProjectsCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  
  // Scroll tracking refs (list container and its inner content)
  const listRef = useRef(null)
  const contentRef = useRef(null)
  const canLoadMoreRef = useRef(true)
  // Map view scroll tracking refs
  const mapListRef = useRef(null)
  const mapContentRef = useRef(null)

  // Ensure refs are hydrated before wiring scroll tracking (avoids Next hydration warning)
  useEffect(() => {
    setHasMounted(true)
  }, [])
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all') // stores client id
  const [contractorFilter, setContractorFilter] = useState('all') // contractor id
  const [clerkOfWorkFilter, setClerkOfWorkFilter] = useState('all') // cow id
  const [projectServiceFilter, setProjectServiceFilter] = useState('all') // service id
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('all') // building type id
  const [projectTypeFilter, setProjectTypeFilter] = useState('all') // project type id
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('all')
  // Removed individual location filters - now using locationSearch
  const [fundingAgencyFilter, setFundingAgencyFilter] = useState('all')
  const [projectManagerFilter, setProjectManagerFilter] = useState('all')
  const [projectCoordinatorFilter, setProjectCoordinatorFilter] = useState('all')
  // Draft versions
  const [draftStatusFilter, setDraftStatusFilter] = useState('all')
  const [draftPriorityFilter, setDraftPriorityFilter] = useState('all')
  const [draftClientFilter, setDraftClientFilter] = useState('all')
  const [draftContractorFilter, setDraftContractorFilter] = useState('all')
  const [draftClerkOfWorkFilter, setDraftClerkOfWorkFilter] = useState('all')
  const [draftProjectServiceFilter, setDraftProjectServiceFilter] = useState('all')
  const [draftBuildingTypeFilter, setDraftBuildingTypeFilter] = useState('all')
  const [draftProjectTypeFilter, setDraftProjectTypeFilter] = useState('all')
  const [draftProjectCategoryFilter, setDraftProjectCategoryFilter] = useState('all')
  const [draftFundingAgencyFilter, setDraftFundingAgencyFilter] = useState('all')
  const [draftProjectManagerFilter, setDraftProjectManagerFilter] = useState('all')
  const [draftProjectCoordinatorFilter, setDraftProjectCoordinatorFilter] = useState('all')
  // Structure free-text search (buildingTypes by name/category/code)
  const [draftStructureSearch, setDraftStructureSearch] = useState('')
  const [draftStructureId, setDraftStructureId] = useState('')
  const [appliedStructureId, setAppliedStructureId] = useState('')
  // Date filters (applied + draft)
  const [contractDateFilter, setContractDateFilter] = useState('')
  const [projectStartDateFilter, setProjectStartDateFilter] = useState('')
  const [projectEndDateFilter, setProjectEndDateFilter] = useState('')
  const [draftContractDateFilter, setDraftContractDateFilter] = useState('')
  const [draftProjectStartDateFilter, setDraftProjectStartDateFilter] = useState('')
  const [draftProjectEndDateFilter, setDraftProjectEndDateFilter] = useState('')
  // Bump to force refetch after apply/clear even if values equal previous
  const [filtersBump, setFiltersBump] = useState(0)
  const structureInputRef = useRef(null)
  const handleStructureChange = (e) => {
    const val = e.target.value
    setDraftStructureSearch(val)
    // Keep focus stable even if parent re-renders
    requestAnimationFrame(() => {
      try { structureInputRef.current && structureInputRef.current.focus() } catch {}
    })
  }
  const [showMap, setShowMap] = useState(true)
  const [showFilters, setShowFilters] = useState(false) // Changed to false by default
  const [viewMode, setViewMode] = useState('map')
  // Location filter is inline (no modal)
  const [expandedFilterGroups, setExpandedFilterGroups] = useState({
    stakeholders: false,
    projectDetails: false
  })

  // Debounced search effects with loading state (use draftSearchTerm)
  useEffect(() => {
    // If cleared, immediately clear debounced
    if (draftSearchTerm === '') {
      setDebouncedSearchTerm('')
      setIsSearching(false)
      return
    }
    if (draftSearchTerm !== debouncedSearchTerm) setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(draftSearchTerm)
      setIsSearching(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [draftSearchTerm, debouncedSearchTerm])

  // Location selection handlers
  const handleLocationSelect = useCallback((location) => {
    // Draft selection only
    setDraftSelectedLocation(location)
  }, [])

  const handleLocationClear = useCallback(() => {
    setDraftSelectedLocation(null)
  }, [])

  // Content options fetched from database for dropdowns
  const [clientsOptions, setClientsOptions] = useState([])
  const [contractorsOptions, setContractorsOptions] = useState([])
  const [clerkOfWorksOptions, setClerkOfWorksOptions] = useState([])
  const [fundingAgenciesOptions, setFundingAgenciesOptions] = useState([])
  const [projectManagersOptions, setProjectManagersOptions] = useState([])
  const [projectCoordinatorsOptions, setProjectCoordinatorsOptions] = useState([])
  const [buildingTypesOptions, setBuildingTypesOptions] = useState([])
  const [projectTypesOptions, setProjectTypesOptions] = useState([])
  const [projectCategoriesOptions, setProjectCategoriesOptions] = useState([])
  const [servicesOptions, setServicesOptions] = useState([])


  // Extract unique locations from projects
  const extractLocations = (projects) => {
    const countries = new Set()
    const regions = new Set()
    const mmdas = new Set()
    const cityTowns = new Set()

    projects.forEach(project => {
      if (project.project_location) {
        if (project.project_location.country) countries.add(project.project_location.country)
        if (project.project_location.region) regions.add(project.project_location.region)
        if (project.project_location.mmda) mmdas.add(project.project_location.mmda)
        if (project.project_location.city_town) cityTowns.add(project.project_location.city_town)
      }
    })

    setLocations({
      countries: Array.from(countries).sort(),
      regions: Array.from(regions).sort(),
      mmdas: Array.from(mmdas).sort(),
      city_towns: Array.from(cityTowns).sort()
    })
  }

  // Fetch total count
  const fetchTotalCount = async () => {
    try {
      const params = new URLSearchParams()
      // Use applied filters for count to avoid stale search terms
      if (appliedSearchTerm) params.set('search', appliedSearchTerm)
      if (selectedLocation) {
        params.set('locationType', selectedLocation.type)
        params.set('locationValue', selectedLocation.value)
      }
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (clientFilter !== 'all') params.set('clientId', String(clientFilter))
      if (contractorFilter !== 'all') params.set('contractorId', String(contractorFilter))
      if (clerkOfWorkFilter !== 'all') params.set('cowId', String(clerkOfWorkFilter))
      if (projectServiceFilter !== 'all') params.set('serviceId', String(projectServiceFilter))
      if (buildingTypeFilter !== 'all') params.set('buildingTypeId', String(buildingTypeFilter))
      if (projectTypeFilter !== 'all') params.set('projectTypeId', String(projectTypeFilter))
      if (projectCategoryFilter !== 'all') params.set('projectCategoryId', String(projectCategoryFilter))
      if (fundingAgencyFilter !== 'all') params.set('fundingAgencyId', String(fundingAgencyFilter))
      if (projectManagerFilter !== 'all') params.set('projectManagerId', String(projectManagerFilter))
      if (projectCoordinatorFilter !== 'all') params.set('projectCoordinatorId', String(projectCoordinatorFilter))
      if (appliedStructureId) params.set('buildingTypeIdExact', String(appliedStructureId))
      if (contractDateFilter) params.set('contractDate', contractDateFilter)
      if (projectStartDateFilter) params.set('projectStartDate', projectStartDateFilter)
      if (projectEndDateFilter) params.set('projectEndDate', projectEndDateFilter)

      const response = await fetch(`/api/projects/count?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setTotalProjectsCount(data.totalCount)
        console.log('Total count updated:', data.totalCount)
      }
    } catch (error) {
      console.error('Error fetching total count:', error)
    }
  }

  // Fetch projects data from API with pagination
  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (appliedSearchTerm) params.set('search', appliedSearchTerm)
    if (selectedLocation) {
      params.set('locationType', selectedLocation.type)
      params.set('locationValue', selectedLocation.value)
    }
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    if (clientFilter !== 'all') params.set('clientId', String(clientFilter))
    if (contractorFilter !== 'all') params.set('contractorId', String(contractorFilter))
    if (clerkOfWorkFilter !== 'all') params.set('cowId', String(clerkOfWorkFilter))
    if (projectServiceFilter !== 'all') params.set('serviceId', String(projectServiceFilter))
    if (buildingTypeFilter !== 'all') params.set('buildingTypeId', String(buildingTypeFilter))
    if (projectTypeFilter !== 'all') params.set('projectTypeId', String(projectTypeFilter))
    if (projectCategoryFilter !== 'all') params.set('projectCategoryId', String(projectCategoryFilter))
    if (fundingAgencyFilter !== 'all') params.set('fundingAgencyId', String(fundingAgencyFilter))
    if (projectManagerFilter !== 'all') params.set('projectManagerId', String(projectManagerFilter))
    if (projectCoordinatorFilter !== 'all') params.set('projectCoordinatorId', String(projectCoordinatorFilter))
    if (appliedStructureId) params.set('buildingTypeIdExact', String(appliedStructureId))
    if (contractDateFilter) params.set('contractDate', contractDateFilter)
    if (projectStartDateFilter) params.set('projectStartDate', projectStartDateFilter)
    if (projectEndDateFilter) params.set('projectEndDate', projectEndDateFilter)
    return params
  }

  const activeController = useRef(null)
  const isInitialMountRef = useRef(true)
  const prevDebouncedSearchRef = useRef('')

  const fetchProjects = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setFiltering(true)
        setCurrentPage(1)
        setDisplayedProjects([])
      } else {
        setLoadingMore(true)
      }

      // Abort in-flight request to avoid race conditions
      if (activeController.current) {
        try {
          activeController.current.abort()
        } catch (err) {
          // Controller already aborted, ignore
        }
      }
      const controller = new AbortController()
      activeController.current = controller

      const params = buildQueryParams()
      params.set('page', String(page))
      params.set('limit', String(itemsPerPage))
      const response = await fetch(`/api/projects?${params.toString()}` , { signal: controller.signal })
      if (response.ok) {
        const data = await response.json()
        const newProjects = data.projects || []
        console.log('Fetched projects:', newProjects.length, 'Total count:', totalProjectsCount)
        
        if (reset) {
          setAllProjects(newProjects)
          setProjects(newProjects)
          setFilteredProjects(newProjects)
          setDisplayedProjects(newProjects)
          extractLocations(newProjects)
        } else {
          const updatedProjects = [...allProjects, ...newProjects]
          setAllProjects(updatedProjects)
          setProjects(updatedProjects)
          setFilteredProjects(updatedProjects)
          setDisplayedProjects(updatedProjects)
        }
        
        setHasMore(newProjects.length === itemsPerPage)
        setCurrentPage(page)
      } else {
        console.error('Failed to fetch projects:', response.statusText)
        if (reset) {
          setProjects([])
          setFilteredProjects([])
          setDisplayedProjects([])
        }
      }
    } catch (error) {
      // Don't log AbortError as it's expected when canceling previous requests
      if (error.name !== 'AbortError') {
        console.error('Error fetching projects:', error)
      }
      if (reset) {
        setProjects([])
        setFilteredProjects([])
        setDisplayedProjects([])
      }
    } finally {
      setLoading(false)
      setFiltering(false)
      setLoadingMore(false)
    }
  }

  // Load more projects
  const loadMoreProjects = () => {
    if (!loadingMore && hasMore) {
      fetchProjects(currentPage + 1, false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    try {
      const get = (k) => searchParams?.get(k)

      // Read URL params
      const urlStatus = get('status') || 'all'
      const urlPriority = get('priority') || 'all'
      const urlClient = get('clientId') || 'all'
      const urlContractor = get('contractorId') || 'all'
      const urlCow = get('cowId') || 'all'
      const urlService = get('serviceId') || 'all'
      const urlBuildingType = get('buildingTypeId') || 'all'
      const urlProjectType = get('projectTypeId') || 'all'
      const urlProjectCategory = get('projectCategoryId') || 'all'
      const urlFundingAgency = get('fundingAgencyId') || 'all'
      const urlPM = get('projectManagerId') || 'all'
      const urlPC = get('projectCoordinatorId') || 'all'
      const urlSearch = get('search') || ''
      const urlLocType = get('locationType')
      const urlLocValue = get('locationValue')
      const urlStructureId = get('buildingTypeIdExact') || ''
      const urlContractDate = get('contractDate') || ''
      const urlStartDate = get('projectStartDate') || ''
      const urlEndDate = get('projectEndDate') || ''

      // Apply to both draft and applied states
      setStatusFilter(urlStatus); setDraftStatusFilter(urlStatus)
      setPriorityFilter(urlPriority); setDraftPriorityFilter(urlPriority)
      setClientFilter(urlClient); setDraftClientFilter(urlClient)
      setContractorFilter(urlContractor); setDraftContractorFilter(urlContractor)
      setClerkOfWorkFilter(urlCow); setDraftClerkOfWorkFilter(urlCow)
      setProjectServiceFilter(urlService); setDraftProjectServiceFilter(urlService)
      setBuildingTypeFilter(urlBuildingType); setDraftBuildingTypeFilter(urlBuildingType)
      setProjectTypeFilter(urlProjectType); setDraftProjectTypeFilter(urlProjectType)
      setProjectCategoryFilter(urlProjectCategory); setDraftProjectCategoryFilter(urlProjectCategory)
      setFundingAgencyFilter(urlFundingAgency); setDraftFundingAgencyFilter(urlFundingAgency)
      setProjectManagerFilter(urlPM); setDraftProjectManagerFilter(urlPM)
      setProjectCoordinatorFilter(urlPC); setDraftProjectCoordinatorFilter(urlPC)

      setAppliedSearchTerm(urlSearch); setDraftSearchTerm(urlSearch); setSearchTerm(urlSearch)

      if (urlLocType && urlLocValue) {
        const loc = { type: urlLocType, value: urlLocValue }
        setSelectedLocation(loc)
        setDraftSelectedLocation(loc)
      } else {
        setSelectedLocation(null); setDraftSelectedLocation(null)
      }

      setAppliedStructureId(urlStructureId); setDraftStructureId(urlStructureId); // label left empty

      setContractDateFilter(urlContractDate); setDraftContractDateFilter(urlContractDate)
      setProjectStartDateFilter(urlStartDate); setDraftProjectStartDateFilter(urlStartDate)
      setProjectEndDateFilter(urlEndDate); setDraftProjectEndDateFilter(urlEndDate)
    } catch (e) {
      console.warn('Failed to initialize filters from URL:', e)
    }

    // Trigger fetch after states are applied
    setFiltersBump((b) => b + 1)
    setInitialLoad(false)
  }, [])

  // Sync URL and refetch when applied filters change - keep URL in sync
  useEffect(() => {
    // Skip on initial mount to avoid race condition with the initial fetch
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    const params = buildQueryParams()
    // reset page on filter changes
    params.set('page', '1')
    params.set('limit', String(itemsPerPage))
    const url = `${pathname}?${params.toString()}`
    router.replace(url)
    
    // Only refetch if it's a significant filter change, not just search
    const isSignificantChange = selectedLocation || statusFilter !== 'all' || priorityFilter !== 'all' || 
      clientFilter !== 'all' || contractorFilter !== 'all' || clerkOfWorkFilter !== 'all' ||
      projectServiceFilter !== 'all' || buildingTypeFilter !== 'all' || projectTypeFilter !== 'all' ||
      projectCategoryFilter !== 'all' || fundingAgencyFilter !== 'all' || projectManagerFilter !== 'all' ||
      projectCoordinatorFilter !== 'all' || appliedStructureId || contractDateFilter || projectStartDateFilter || projectEndDateFilter
    
    if (isSignificantChange || appliedSearchTerm !== prevDebouncedSearchRef.current) {
      fetchProjects(1, true)
    }
    
    fetchTotalCount()
    // Track previous applied search term for next run
    prevDebouncedSearchRef.current = appliedSearchTerm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearchTerm, selectedLocation, statusFilter, priorityFilter, clientFilter, contractorFilter, clerkOfWorkFilter, projectServiceFilter, buildingTypeFilter, projectTypeFilter, projectCategoryFilter, fundingAgencyFilter, projectManagerFilter, projectCoordinatorFilter, appliedStructureId, contractDateFilter, projectStartDateFilter, projectEndDateFilter, filtersBump])

  // Fetch content options for dropdowns
  useEffect(() => {
    const fetchContentOptions = async () => {
      try {
        const [
          clientsRes,
          contractorsRes,
          buildingTypesRes,
          projectTypesRes,
          projectCategoriesRes,
          servicesRes,
          clerkOfWorksRes,
          fundingAgenciesRes,
          projectManagersRes,
          projectCoordinatorsRes
        ] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/contractors'),
          fetch('/api/building-types'),
          fetch('/api/project-types'),
          fetch('/api/project-category'),
          fetch('/api/services'),
          fetch('/api/clerk-of-works'),
          fetch('/api/funding-agencies'),
          fetch('/api/project-managers'),
          fetch('/api/project-coordinators')
        ])

        const [
          clientsData,
          contractorsData,
          buildingTypesData,
          projectTypesData,
          projectCategoriesData,
          servicesData,
          clerkOfWorksData,
          fundingAgenciesData,
          projectManagersData,
          projectCoordinatorsData
        ] = await Promise.all([
          clientsRes.json(),
          contractorsRes.json(),
          buildingTypesRes.json(),
          projectTypesRes.json(),
          projectCategoriesRes.json(),
          servicesRes.json(),
          clerkOfWorksRes.json(),
          fundingAgenciesRes.json(),
          projectManagersRes.json(),
          projectCoordinatorsRes.json()
        ])

        if (clientsData?.success) setClientsOptions(clientsData.clients || [])
        if (contractorsData?.success) setContractorsOptions(contractorsData.contractors || [])
        if (clerkOfWorksData?.success) setClerkOfWorksOptions(clerkOfWorksData.clerkOfWorks || [])
        if (fundingAgenciesData?.success) setFundingAgenciesOptions(fundingAgenciesData.fundingAgencies || [])
        if (projectManagersData?.success) setProjectManagersOptions(projectManagersData.projectManagers || [])
        if (projectCoordinatorsData?.success) setProjectCoordinatorsOptions(projectCoordinatorsData.projectCoordinators || [])
        if (buildingTypesData?.success) setBuildingTypesOptions(buildingTypesData.buildingTypes || [])
        if (projectTypesData?.success) setProjectTypesOptions(projectTypesData.projectTypes || [])
        if (projectCategoriesData?.success) setProjectCategoriesOptions(projectCategoriesData.projectCategories || [])
        if (servicesData?.success) setServicesOptions(servicesData.services || [])
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }
    fetchContentOptions()
  }, [])

  // Auto-switch to list view on small devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('list')
      }
    }
    
    handleResize() // Check on mount
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Removed legacy phase-based progress calculation; using cumulative_progress and planned_progress instead

  const calculateDuration = (project) => {
    if (!project.project_start_date || !project.project_end_date) {
      return 'TBD'
    }
    
    const start = new Date(project.project_start_date)
    const end = new Date(project.project_end_date)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const months = Math.floor(diffDays / 30)
    const days = diffDays % 30
    
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` and ${days} days` : ''}`
    }
    return `${days} days`
  }

  const displayDuration = (project) => {
    if (project.project_duration && typeof project.project_duration === 'string' && project.project_duration.trim() !== '') {
      return project.project_duration
    }
    return calculateDuration(project)
  }

  const getProgress = (project) => {
    const toPct = (value) => {
      const n = Number(value)
      if (!Number.isFinite(n)) return 0
      return Math.max(0, Math.min(100, n))
    }
    return {
      planned: toPct(project.planned_progress),
      cumulative: toPct(project.cumulative_progress)
    }
  }

  const calculateRemainingDays = (project) => {
    if (!project.contract_date) {
      return 'No contract date'
    }
    
    const end = new Date(project.contract_date)
    const now = new Date()
    const diffTime = end - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    return `${diffDays} days`
  }

  // Helper function to get names from project stakeholder arrays
  const getNamesFromStakeholders = (stakeholders, nameField = 'name') => {
    if (!Array.isArray(stakeholders)) return []
    return stakeholders.map(stakeholder => stakeholder[nameField]).filter(Boolean)
  }

  // Get unique values for filters using actual names
  const getUniqueClients = () => {
    const clientNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_clients, 'clientName')
    )
    return [...new Set(clientNames)]
  }

  const getUniqueContractors = () => {
    const contractorNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.contractors, 'fullName')
    )
    return [...new Set(contractorNames)]
  }

  const getUniqueClerkOfWorks = () => {
    const clerkNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.clerk_of_works, 'fullName')
    )
    return [...new Set(clerkNames)]
  }

  const getUniqueProjectServices = () => {
    const serviceNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_services, 'serviceName')
    )
    return [...new Set(serviceNames)]
  }

  const getUniqueBuildingTypes = () => {
    const buildingTypeNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.building_types, 'buildingType')
    )
    return [...new Set(buildingTypeNames)]
  }

  const getUniqueProjectTypes = () => {
    const projectTypeNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_types, 'projectType')
    )
    return [...new Set(projectTypeNames)]
  }

  const getUniqueProjectCategories = () => {
    const categoryNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_categories, 'category')
    )
    return [...new Set(categoryNames)]
  }

  // Removed location filter functions - now using locationSearch

  const getUniqueFundingAgencies = () => {
    const agencyNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.funding_agencies, 'agencyName')
    )
    return [...new Set(agencyNames)]
  }

  const getUniqueProjectManagers = () => {
    const managerNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_managers, 'managerName')
    )
    return [...new Set(managerNames)]
  }

  const getUniqueProjectCoordinators = () => {
    const coordinatorNames = projects.flatMap(project => 
      getNamesFromStakeholders(project.project_coordinators, 'fullName')
    )
    return [...new Set(coordinatorNames)]
  }

  // Remove client-side filtering since we're doing server-side filtering
  // The API already returns filtered results

  const handleProjectClick = (project) => {
    setExpandedProject(expandedProject === project.project_id ? null : project.project_id)
  }

  const handleViewProject = (project) => {
    router.push(`/projects/${project.project_slug}/preview`)
  }

  const handleEditProject = (project) => {
    router.push(`/projects/${project.project_slug}/overview`)
  }

  // Track scroll progress of the project list container against its content
  // Scroll progress for list view (guard until refs are attached)
  const canWireListScroll = hasMounted && viewMode === 'list' && listRef.current && contentRef.current
  const { scrollYProgress: listScrollYProgress } = useScroll({
    container: canWireListScroll ? listRef : undefined,
    target: canWireListScroll ? contentRef : undefined,
    offset: ["start end", "end end"]
  })

  // Scroll progress for map view sidebar list (guard until refs are attached)
  const canWireMapScroll = hasMounted && viewMode === 'map' && mapListRef.current && mapContentRef.current
  const { scrollYProgress: mapScrollYProgress } = useScroll({
    container: canWireMapScroll ? mapListRef : undefined,
    target: canWireMapScroll ? mapContentRef : undefined,
    offset: ["start end", "end end"]
  })

  // Trigger load more when near the end of the container's scroll
  // Load more for list view
  useMotionValueEvent(listScrollYProgress, 'change', (value) => {
    if (!hasMounted || viewMode !== 'list' || !canWireListScroll) return
    if (value < 0.9) {
      canLoadMoreRef.current = true
      return
    }
    if (value >= 0.98 && canLoadMoreRef.current && hasMore && !loadingMore) {
      canLoadMoreRef.current = false
      loadMoreProjects()
    }
  })

  // Load more for map view
  useMotionValueEvent(mapScrollYProgress, 'change', (value) => {
    if (!hasMounted || viewMode !== 'map' || !canWireMapScroll) return
    if (value < 0.9) {
      canLoadMoreRef.current = true
      return
    }
    if (value >= 0.98 && canLoadMoreRef.current && hasMore && !loadingMore) {
      canLoadMoreRef.current = false
        loadMoreProjects()
      }
  })

  const toggleFilterGroup = (groupName) => {
    setExpandedFilterGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'on hold':
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProjectGallery = (project) => {
    const images = []
    
    // Add cover image if it exists
    if (project.project_cover_image?.url) {
      images.push(project.project_cover_image.url)
    }
    
    // Add placeholder if no images - using a simple colored div instead of external image
    if (images.length === 0) {
      images.push('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE1MCA4OS41IDE1OC41IDgxIDE2OSA4MUgxMzFDMTQxLjUgODEgMTUwIDg5LjUgMTUwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAxMDBDMTUwIDExMC41IDE0MS41IDExOSAxMzEgMTE5SDE2OUwxNTAgMTE5QzE1OC41IDExOSAxNTAgMTEwLjUgMTUwIDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K')
    }
    
    return images
  }

  // Map Sidebar Skeleton Component
  const MapSidebarSkeleton = () => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-4/5"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
          <div className="bg-gray-300 dark:bg-gray-500 h-2 rounded-full w-3/4"></div>
        </div>
        <div className="flex justify-between items-center mb-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-14"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
          <div className="bg-gray-300 dark:bg-gray-500 h-2 rounded-full w-1/2"></div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-14"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
        </div>
      </div>
    </div>
  )
  const ProjectSkeleton = () => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)] animate-pulse">
      {/* Header */}
      <div className="mb-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-4/5"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-4 w-1/2"></div>
      </div>
      
      {/* Progress bars */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
          <div className="bg-gray-300 dark:bg-gray-500 h-2 rounded-full w-3/4"></div>
        </div>
        <div className="flex justify-between items-center mb-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
          <div className="bg-gray-300 dark:bg-gray-500 h-2 rounded-full w-1/2"></div>
        </div>
      </div>

      {/* Image placeholder */}
      <div className="mb-3">
        <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
        </div>
      </div>
    </div>
  )

  // Memoized search handlers to prevent re-renders
  const handleProjectSearchSelect = useCallback((selection) => {
    // selection: { type: 'project' | 'institution', value: string, slug?: string }
    const v = selection.value || ''
    // Set draft & applied search immediately
    setDraftSearchTerm(v)
    setAppliedSearchTerm(v)
    setSearchTerm(v)
    // Reset other filters to avoid accidental exclusions
    setDraftSelectedLocation(null)
    setSelectedLocation(null)
    setDraftStatusFilter('all'); setStatusFilter('all')
    setDraftPriorityFilter('all'); setPriorityFilter('all')
    setDraftClientFilter('all'); setClientFilter('all')
    setDraftContractorFilter('all'); setContractorFilter('all')
    setDraftClerkOfWorkFilter('all'); setClerkOfWorkFilter('all')
    setDraftProjectServiceFilter('all'); setProjectServiceFilter('all')
    setDraftBuildingTypeFilter('all'); setBuildingTypeFilter('all')
    setDraftProjectTypeFilter('all'); setProjectTypeFilter('all')
    setDraftProjectCategoryFilter('all'); setProjectCategoryFilter('all')
    setDraftFundingAgencyFilter('all'); setFundingAgencyFilter('all')
    setDraftProjectManagerFilter('all'); setProjectManagerFilter('all')
    setDraftProjectCoordinatorFilter('all'); setProjectCoordinatorFilter('all')
    setDraftStructureSearch(''); setDraftStructureId(''); setAppliedStructureId('')
    setDraftContractDateFilter(''); setContractDateFilter('')
    setDraftProjectStartDateFilter(''); setProjectStartDateFilter('')
    setDraftProjectEndDateFilter(''); setProjectEndDateFilter('')
    setCurrentPage(1)
    // Trigger immediate refetch/update
    setFiltersBump((b) => b + 1)
  }, [])

  // Removed modal version of location filter

  // Draft/applied helpers
  const hasDirtyFilters = (
    draftSearchTerm !== appliedSearchTerm ||
    JSON.stringify(draftSelectedLocation) !== JSON.stringify(selectedLocation) ||
    draftStatusFilter !== statusFilter ||
    draftPriorityFilter !== priorityFilter ||
    draftClientFilter !== clientFilter ||
    draftContractorFilter !== contractorFilter ||
    draftClerkOfWorkFilter !== clerkOfWorkFilter ||
    draftProjectServiceFilter !== projectServiceFilter ||
    draftBuildingTypeFilter !== buildingTypeFilter ||
    draftProjectTypeFilter !== projectTypeFilter ||
    draftProjectCategoryFilter !== projectCategoryFilter ||
    draftFundingAgencyFilter !== fundingAgencyFilter ||
    draftProjectManagerFilter !== projectManagerFilter ||
    draftProjectCoordinatorFilter !== projectCoordinatorFilter ||
    draftStructureId !== appliedStructureId ||
    draftContractDateFilter !== contractDateFilter ||
    draftProjectStartDateFilter !== projectStartDateFilter ||
    draftProjectEndDateFilter !== projectEndDateFilter
  )

  const applyFilters = () => {
    setAppliedSearchTerm(draftSearchTerm)
    setSearchTerm(draftSearchTerm)
    setSelectedLocation(draftSelectedLocation)
    setStatusFilter(draftStatusFilter)
    setPriorityFilter(draftPriorityFilter)
    setClientFilter(draftClientFilter)
    setContractorFilter(draftContractorFilter)
    setClerkOfWorkFilter(draftClerkOfWorkFilter)
    setProjectServiceFilter(draftProjectServiceFilter)
    setBuildingTypeFilter(draftBuildingTypeFilter)
    setProjectTypeFilter(draftProjectTypeFilter)
    setProjectCategoryFilter(draftProjectCategoryFilter)
    setFundingAgencyFilter(draftFundingAgencyFilter)
    setProjectManagerFilter(draftProjectManagerFilter)
    setProjectCoordinatorFilter(draftProjectCoordinatorFilter)
    setAppliedStructureId(draftStructureId)
    setContractDateFilter(draftContractDateFilter)
    setProjectStartDateFilter(draftProjectStartDateFilter)
    setProjectEndDateFilter(draftProjectEndDateFilter)
    setCurrentPage(1)
    // Force build of new URL and refetch now by toggling applied search
    setFiltersBump((b) => b + 1)
  }

  const resetDraftToDefaults = () => {
    setDraftSearchTerm('')
    setDebouncedSearchTerm('')
    setDraftSelectedLocation(null)
    setDraftStatusFilter('all')
    setDraftPriorityFilter('all')
    setDraftClientFilter('all')
    setDraftContractorFilter('all')
    setDraftClerkOfWorkFilter('all')
    setDraftProjectServiceFilter('all')
    setDraftBuildingTypeFilter('all')
    setDraftProjectTypeFilter('all')
    setDraftProjectCategoryFilter('all')
    setDraftFundingAgencyFilter('all')
    setDraftProjectManagerFilter('all')
    setDraftProjectCoordinatorFilter('all')
    setDraftStructureSearch('')
    setDraftStructureId('')
    setDraftContractDateFilter('')
    setDraftProjectStartDateFilter('')
    setDraftProjectEndDateFilter('')
  }

  const resetAppliedToDefaults = () => {
    setAppliedSearchTerm('')
    setSearchTerm('')
    setSelectedLocation(null)
    setStatusFilter('all')
    setPriorityFilter('all')
    setClientFilter('all')
    setContractorFilter('all')
    setClerkOfWorkFilter('all')
    setProjectServiceFilter('all')
    setBuildingTypeFilter('all')
    setProjectTypeFilter('all')
    setProjectCategoryFilter('all')
    setFundingAgencyFilter('all')
    setProjectManagerFilter('all')
    setProjectCoordinatorFilter('all')
    setAppliedStructureId('')
    setContractDateFilter('')
    setProjectStartDateFilter('')
    setProjectEndDateFilter('')
    setCurrentPage(1)
    setFiltersBump((b) => b + 1)
  }

  // Reusable Filter Component
  const FilterComponent = ({ className = "" }) => (
    <div className={`bg-white shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <h6 className="!text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FiFilter className="mr-2" />
        Advanced Filters
      </h6>
      
      <div className="space-y-4">
        {/* Search (Project Name or Institution) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Projects
          </label>
          <ProjectSearchDropdown
              value={draftSearchTerm}
            onSelect={handleProjectSearchSelect}
            placeholder="Search by project name or institution name..."
            />
          </div>

        {/* Location Search (inline, like other groups) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Location
          </label>
          <LocationSearchDropdown
            selectedLocation={draftSelectedLocation}
            onLocationSelect={handleLocationSelect}
            onLocationClear={handleLocationClear}
            placeholder="Search by MMDA, region, country, address, city/town..."
          />
        </div>



               {/* Structure Search (Building Types by name/category/code) */}
               <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Structure
          </label>
          <StructureSearchDropdown
            value={draftStructureSearch}
            onSelect={(s) => { setDraftStructureSearch(s.label || ''); setDraftStructureId(s.id ? String(s.id) : '') }}
            placeholder="Search by structure type, shape (category), or code..."
          />
          {/* <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Examples: Classroom, Straight, BT-001</p> */}
        </div>

        {/* Project Overview Filters Group */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
          <button
            onClick={() => toggleFilterGroup('projectDetails')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-white">Project Overview</span>
            {expandedFilterGroups.projectDetails ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
          </button>
          {expandedFilterGroups.projectDetails && (
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={draftStatusFilter}
                    onChange={(e) => setDraftStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={draftPriorityFilter}
                    onChange={(e) => setDraftPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Service
                  </label>
                  <select
                    value={draftProjectServiceFilter}
                    onChange={(e) => setDraftProjectServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Services</option>
                    {servicesOptions.map(service => (
                      <option key={service.id} value={service.id}>{service.serviceName}</option>
                    ))}
                  </select>
                </div>

                {/* Removed Building Type dropdown; use free-text Structure search below */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Type
                  </label>
                  <select
                    value={draftProjectTypeFilter}
                    onChange={(e) => setDraftProjectTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Types</option>
                    {projectTypesOptions.map(type => (
                      <option key={type.id} value={type.id}>{type.projectType}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Category
                  </label>
                  <select
                    value={draftProjectCategoryFilter}
                    onChange={(e) => setDraftProjectCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Categories</option>
                    {projectCategoriesOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.category}</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Date
                  </label>
                  <input
                    type="date"
                    value={draftContractDateFilter}
                    onChange={(e) => setDraftContractDateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Start Date
                  </label>
                  <input
                    type="date"
                    value={draftProjectStartDateFilter}
                    onChange={(e) => setDraftProjectStartDateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project End Date
                  </label>
                  <input
                    type="date"
                    value={draftProjectEndDateFilter}
                    onChange={(e) => setDraftProjectEndDateFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* Location filtering is now handled by the location search input above */}

 

        {/* Stakeholders Filters Group */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
          <button
            onClick={() => toggleFilterGroup('stakeholders')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-white">Stakeholders</span>
            {expandedFilterGroups.stakeholders ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
          </button>
          {expandedFilterGroups.stakeholders && (
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client
                  </label>
                  <select
                    value={draftClientFilter}
                    onChange={(e) => setDraftClientFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Clients</option>
                    {clientsOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.clientName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contractor
                  </label>
                  <select
                    value={draftContractorFilter}
                    onChange={(e) => setDraftContractorFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Contractors</option>
                    {contractorsOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clerk of Works
                  </label>
                  <select
                    value={draftClerkOfWorkFilter}
                    onChange={(e) => setDraftClerkOfWorkFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Clerk of Works</option>
                    {clerkOfWorksOptions.map(cow => (
                      <option key={cow.id} value={cow.id}>{cow.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Funding Agency
                  </label>
                  <select
                    value={draftFundingAgencyFilter}
                    onChange={(e) => setDraftFundingAgencyFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Funding Agencies</option>
                    {fundingAgenciesOptions.map(agency => (
                      <option key={agency.id} value={agency.id}>{agency.agencyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Manager
                  </label>
                  <select
                    value={draftProjectManagerFilter}
                    onChange={(e) => setDraftProjectManagerFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Managers</option>
                    {projectManagersOptions.map(manager => (
                      <option key={manager.id} value={manager.id}>{manager.managerName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Coordinator
                  </label>
                  <select
                    value={draftProjectCoordinatorFilter}
                    onChange={(e) => setDraftProjectCoordinatorFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Coordinators</option>
                    {projectCoordinatorsOptions.map(coordinator => (
                      <option key={coordinator.id} value={coordinator.id}>{coordinator.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear All Filters Button */}
        <button
          onClick={applyFilters}
          disabled={!hasDirtyFilters}
          className={`w-full px-4 py-2 mb-2 text-white text-sm font-medium rounded-lg transition-colors ${hasDirtyFilters ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            // Reset draft and applied, trigger initial fetch
            resetDraftToDefaults()
            resetAppliedToDefaults()
            setTimeout(() => {
              fetchProjects(1, true)
              fetchTotalCount()
            }, 50)
          }}
          className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Header with Total Count */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center flex-wrap">
          <div className="flex items-center space-x-4">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            Project Dashboard
          </h4>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {totalProjectsCount} Total Projects
              </div>
              {isSearching && (
                <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                  <span>Searching...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/projects/addNewProject/overview')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span className=" sm:inline">Add New Project</span>
            </button>
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-3 py-2 ${viewMode === 'map' ? 'bg-blue-600' : 'bg-gray-600'} text-white text-sm rounded-lg hover:bg-blue-700 transition-colors`}
              >
                <FiMap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-600'} text-white text-sm rounded-lg hover:bg-blue-700 transition-colors`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='relative'>
        {/* Map Section */}
        {viewMode === 'map' && showMap && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="h-screen relative">
              {(isSearching || filtering) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
                  </div>
                </div>
              ) : (
              <ProjectMap
                  projects={isSearching || filtering ? [] : displayedProjects}
                height="100%"
                showPopup={true}
                onMarkerClick={handleProjectClick}
              />
              )}
            </div>
          </div>
        )}

        {/* List View Section */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex relative">
              {/* Projects Grid */}
              <div ref={listRef} className="flex-1 p-6 max-h-[80vh] overflow-y-auto project-list-container">
                <div ref={contentRef} className="flex flex-wrap gap-4">
                  {(filtering || isSearching) && displayedProjects.length === 0 ? (
                    // Skeleton loading for search/filter
                    Array.from({ length: 6 }).map((_, index) => (
                      <ProjectSkeleton key={index} />
                    ))
                  ) : (
                    displayedProjects.map((project, index) => {
                    const { planned, cumulative } = getProgress(project)
                    const progressActual = cumulative
                    const progressPlanned = planned
                    const duration = displayDuration(project)
                    const remainingDays = calculateRemainingDays(project)
                    const isExpanded = expandedProject === project.project_id
                    
                    return (
                      <div
                        key={`${project.project_id}-${index}`}
                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)] ${
                          isExpanded ? 'shadow-xl border-blue-300 dark:border-blue-600' : ''
                        }`}
                        onClick={() => handleProjectClick(project)}
                      >
                        {/* Basic Project Info */}
                        <div className="mb-3">
                          <h5 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProject(project)
                            }}
                            className="font-semibold text-gray-900 dark:text-white !text-sm mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {project.project_name}
                          </h5>
                          <div className="flex items-center space-x-2 !text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <FiMapPin className="text-gray-400" />
                            <span>{project.project_location?.mmda}, {project.project_location?.region}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 !text-sm font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                              {project.project_status}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewProject(project)
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                title="Preview Project"
                              >
                                <FiEye className="text-sm" />
                              </button>
                              {canEditProjects && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditProject(project)
                                  }}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1"
                                  title="Edit Project"
                                >
                                  <FiEdit className="text-sm" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress - Actual vs Planned */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="!text-sm text-gray-600 dark:text-gray-400">Cumulative Progress</span>
                            <span className="!text-sm font-medium text-gray-900 dark:text-white">
                              {Math.round(progressActual)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressActual}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="!text-sm text-gray-600 dark:text-gray-400">Planned Progress</span>
                            <span className="!text-sm font-medium text-gray-900 dark:text-white">
                              {Math.round(progressPlanned)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPlanned}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Project Image */}
                        {project.project_cover_image?.url && (
                          <div className="mb-3">
                            <img
                              src={project.project_cover_image.url}
                              alt={project.project_name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        {/* Basic Project Details */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center !text-sm">
                            <FiUser className="text-gray-400 mr-1 w-3 h-3" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 !text-sm">Client</p>
                              <p className="font-medium text-gray-900 dark:text-white truncate !text-sm">
                                {getNamesFromStakeholders(project.project_clients, 'clientName')[0] || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center !text-sm">
                            <FiDollarSign className="text-gray-400 mr-1 w-3 h-3" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 !text-sm">Service</p>
                              <p className="font-medium text-gray-900 dark:text-white truncate !text-sm">
                                {getNamesFromStakeholders(project.project_services, 'serviceName')[0] || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center !text-sm">
                            <FiUser className="text-gray-400 mr-1 w-3 h-3" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 !text-sm">Manager</p>
                              <p className="font-medium text-gray-900 dark:text-white truncate !text-sm">
                                {getNamesFromStakeholders(project.project_managers, 'managerName')[0] || 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center !text-sm">
                            <FiDollarSign className="text-gray-400 mr-1 w-3 h-3" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 !text-sm">Type</p>
                              <p className="font-medium text-gray-900 dark:text-white truncate !text-sm">
                                {getNamesFromStakeholders(project.building_types, 'buildingType')[0] || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                            {/* Project Description */}
                            {project.project_description && (
                              <div>
                                <h6 className="!text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h6>
                                <p className="!text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                  {project.project_description}
                                </p>
                              </div>
                            )}

                            {/* Detailed Information Grid */}
                            <div className="grid grid-cols-2 gap-3 !text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Priority</p>
                                <p className="font-medium text-gray-900 dark:text-white capitalize !text-sm">
                                  {project.project_priority}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Duration</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {duration}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Start Date</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {project.project_start_date ? new Date(project.project_start_date).toLocaleDateString() : 'TBD'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Contract Date</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {project.contract_date ? new Date(project.contract_date).toLocaleDateString() : 'TBD'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Site Possession</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {project.site_possession_date ? new Date(project.site_possession_date).toLocaleDateString() : 'TBD'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Planned Progress</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {progressPlanned !== null ? `${progressPlanned}%` : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1 !text-sm">Cumulative Progress</p>
                                <p className="font-medium text-gray-900 dark:text-white !text-sm">
                                  {progressActual}%
                                </p>
                              </div>
                            </div>

                            {/* Additional Stakeholders */}
                            <div className="space-y-2">
                              <h6 className="!text-sm font-medium text-gray-700 dark:text-gray-300">Stakeholders</h6>
                              <div className="flex flex-wrap gap-4">
                                {project.contractors && project.contractors.length > 0 && (
                                  <div className="min-w-[220px] flex-1">
                                    <p className="!text-sm text-gray-500 dark:text-gray-400 mb-1">Contractors</p>
                                    <div className="flex flex-wrap gap-1">
                                      {getNamesFromStakeholders(project.contractors, 'fullName').map((contractor, index) => (
                                        <span key={index} className="px-2 py-1 bg-[#29166F] text-white !text-xs rounded-full">
                                          {contractor}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {project.clerk_of_works && project.clerk_of_works.length > 0 && (
                                  <div className="min-w-[220px] flex-1">
                                    <p className="!text-sm text-gray-500 dark:text-gray-400 mb-1">Clerk of Works</p>
                                    <div className="flex flex-wrap gap-1">
                                      {getNamesFromStakeholders(project.clerk_of_works, 'fullName').map((clerk, index) => (
                                        <span key={index} className="px-2 py-1 bg-[#29166F] text-white !text-xs rounded-full">
                                          {clerk}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {project.project_coordinators && project.project_coordinators.length > 0 && (
                                  <div className="min-w-[220px] flex-1">
                                    <p className="!text-sm text-gray-500 dark:text-gray-400 mb-1">Coordinators</p>
                                    <div className="flex flex-wrap gap-1">
                                      {getNamesFromStakeholders(project.project_coordinators, 'fullName').map((coordinator, index) => (
                                        <span key={index} className="px-2 py-1 bg-[#29166F] text-white !text-xs rounded-full">
                                          {coordinator}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewProject(project)
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white !text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                View Preview
                              </button>
                              {canEditProjects && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditProject(project)
                                  }}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white !text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Edit Project
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Remaining Days */}
                        {/* <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                          <span className="!text-sm text-gray-500 dark:text-gray-400">Days Until Contract Date</span>
                            <span className={`!text-sm font-medium ${
                              remainingDays === 'Overdue' ? 'text-red-600' :
                              remainingDays === 'Due today' ? 'text-yellow-600' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {remainingDays}
                            </span>
                          </div>
                        </div> */}
                      </div>
                    )
                  })
                  )}
                </div>
                
                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="w-full flex justify-center py-8">
                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-6 py-4 shadow-lg animate-pulse">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading more projects...</span>
                    </div>
                  </div>
                )}

                {/* End Of Results */}
                {!loadingMore && !hasMore && displayedProjects.length > 0 && (
                  <div className="w-full flex justify-center py-8">
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-6 py-4">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">End Of Results</span>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Load More Button (fallback) */}
                {!loadingMore && hasMore && displayedProjects.length > 0 && (
                  <div className="text-center py-8">
                    <button
                      onClick={loadMoreProjects}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Load More Projects
                    </button>
                  </div>
                )}

                {/* No More Projects - Removed, using "End Of Results" above */}
                
                {displayedProjects.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FiSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No projects found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try adjusting your search criteria or filters
                    </p>
                  </div>
                )}
              </div>
              
              {/* Right Sidebar for List View - Hidden on small devices */}
              <div className="hidden md:block w-80 bg-gray-50 dark:bg-gray-900 flex flex-col">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-10 h-10 m-4 space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <span>{showFilters ? <MdCancel className="w-4 h-4" />:<FiFilter className="w-4 h-4" />}</span>
                </button>

                {showFilters && (
                  <FilterComponent className="mb-6" />
                )}

                {/* Filters Only */}
                <div className="p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Filters
                  </h6>
                  <p className="!text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Use the filters below to narrow down your project search
                  </p>
                </div>
              </div>

              {/* Mobile Filters - Absolutely positioned only on small devices */}
              <div className="md:hidden absolute top-0 right-0 w-full h-full pointer-events-none">
                {/* Filter Toggle Button - Positioned within projects container */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="absolute top-4 right-4 z-50 w-12 h-12 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-lg pointer-events-auto flex items-center justify-center"
                >
                  <span>{showFilters ? <MdCancel className="w-5 h-5" />:<FiFilter className="w-5 h-5" />}</span>
                </button>

                {/* Filters - Absolutely Positioned Over Projects - Only on mobile */}
                {showFilters && (
                  <div className="absolute top-0 right-0 z-40 w-4/5 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg pointer-events-auto">
                    <FilterComponent className="mb-0" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Sidebar - Only show in map view */}
        {viewMode === 'map' && (
          <div ref={mapListRef} className="absolute top-0 z-800 left-0 w-1/3 bg-white/10 backdrop-blur-md max-h-[95%] overflow-y-auto dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div ref={mapContentRef} className="p-6">
              <h6 className="font-semibold sticky top-0 backdrop-blur-md p-4 z-10 text-gray-900 ">
                Projects ({totalProjectsCount} total, {displayedProjects.length} shown)
              </h6>
              
              <div className="space-y-4">
                {(filtering || isSearching) && displayedProjects.length === 0 ? (
                  // Skeleton loading for map sidebar
                  Array.from({ length: 4 }).map((_, index) => (
                    <MapSidebarSkeleton key={index} />
                  ))
                ) : (
                  displayedProjects.map((project, index) => {
                  const { planned, cumulative } = getProgress(project)
                  const progressActual = cumulative
                  const progressPlanned = planned
                  const duration = displayDuration(project)
                  const remainingDays = calculateRemainingDays(project)
                  const isExpanded = expandedProject === project.project_id
                  
                  return (
                    <div
                      key={`${project.project_id}-${index}`}
                      className={`bg-gray-50 max-w-sm dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                        isExpanded ? 'shadow-xl border-blue-300 dark:border-blue-600' : ''
                      }`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h6 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProject(project)
                            }}
                            className="font-semibold text-gray-900 dark:text-white text-sm mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {project.project_name}
                          </h6>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <FiMapPin className="text-gray-400" />
                            <span>{project.project_location?.mmda}, {project.project_location?.region}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                            {project.project_status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProject(project)
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Preview Project"
                          >
                            <FiEye className="text-sm" />
                          </button>
                          {canEditProjects && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditProject(project)
                              }}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Edit Project"
                            >
                              <FiEdit className="text-sm" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress - Actual vs Planned */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Cumulative Progress</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {Math.round(progressActual)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressActual}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Planned Progress</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {Math.round(progressPlanned)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPlanned}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                          {/* Project Description */}
                          {project.project_description && (
                            <div>
                              <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h6>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                                {project.project_description}
                              </p>
                            </div>
                          )}

                          {/* Key Details */}
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Client:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getNamesFromStakeholders(project.project_clients, 'clientName')[0] || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Service:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getNamesFromStakeholders(project.project_services, 'serviceName')[0] || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Manager:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getNamesFromStakeholders(project.project_managers, 'managerName')[0] || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Type:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getNamesFromStakeholders(project.building_types, 'buildingType')[0] || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {project.project_priority}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {duration}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewProject(project)
                              }}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Preview
                            </button>
                            {canEditProjects && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditProject(project)
                                }}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Edit Project
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Remaining Days */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Days Until Contract Date</span>
                          <span className={`text-xs font-medium ${
                            remainingDays === 'Overdue' ? 'text-red-600' :
                            remainingDays === 'Due today' ? 'text-yellow-600' :
                            'text-gray-900 dark:text-white'
                          }`}>
                            {remainingDays}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar - Filters and Project Details - Only show in map view */}
        {viewMode === 'map' && (
          <div className="absolute top-0 right-0 z-800 w-96 bg-white/10 backdrop-blur-md max-h-[95%] overflow-y-auto dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-10 h-10 mb-4 space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <span>{showFilters ? <MdCancel className="w-4 h-4" />:<FiFilter className="w-4 h-4" />}</span>
              </button>

              {showFilters && (
                <FilterComponent className="mb-6" />
              )}

              {/* Filters Only */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Filters
                </h6>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Use the filters below to narrow down your project search
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDashboardFixed
