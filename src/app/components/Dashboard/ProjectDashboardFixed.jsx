'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiMapPin, FiCalendar, FiUser, FiClock, FiEye, FiSearch, FiFilter, FiDollarSign, FiMap, FiImage, FiList, FiChevronDown, FiChevronRight, FiPlus } from 'react-icons/fi'
import ProjectMap from '../Map/ProjectMap'
import ProjectDataSummary from '../Projects/ProjectDataSummary'
import { MdCancel } from "react-icons/md";

const ProjectDashboardFixed = () => {
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState(null)
  const [expandedProject, setExpandedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  
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
    cities: [],
    towns: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [contractorFilter, setContractorFilter] = useState('all')
  const [clerkOfWorkFilter, setClerkOfWorkFilter] = useState('all')
  const [projectServiceFilter, setProjectServiceFilter] = useState('all')
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [townFilter, setTownFilter] = useState('all')
  const [fundingAgencyFilter, setFundingAgencyFilter] = useState('all')
  const [projectManagerFilter, setProjectManagerFilter] = useState('all')
  const [projectCoordinatorFilter, setProjectCoordinatorFilter] = useState('all')
  const [showMap, setShowMap] = useState(true)
  const [showFilters, setShowFilters] = useState(false) // Changed to false by default
  const [viewMode, setViewMode] = useState('map')
  const [expandedFilterGroups, setExpandedFilterGroups] = useState({
    location: true,
    stakeholders: false,
    projectDetails: false
  })


  // Extract unique locations from projects
  const extractLocations = (projects) => {
    const countries = new Set()
    const regions = new Set()
    const cities = new Set()
    const towns = new Set()

    projects.forEach(project => {
      if (project.project_location) {
        if (project.project_location.country) countries.add(project.project_location.country)
        if (project.project_location.region) regions.add(project.project_location.region)
        if (project.project_location.city) cities.add(project.project_location.city)
        if (project.project_location.town) towns.add(project.project_location.town)
      }
    })

    setLocations({
      countries: Array.from(countries).sort(),
      regions: Array.from(regions).sort(),
      cities: Array.from(cities).sort(),
      towns: Array.from(towns).sort()
    })
  }

  // Fetch projects data from API with pagination
  const fetchProjects = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(1)
        setDisplayedProjects([])
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/projects?page=${page}&limit=${itemsPerPage}`)
      if (response.ok) {
        const data = await response.json()
        const newProjects = data.projects || []
        
        if (reset) {
          setAllProjects(newProjects)
          setProjects(newProjects)
          setFilteredProjects(newProjects)
          setDisplayedProjects(newProjects.slice(0, itemsPerPage))
          extractLocations(newProjects)
        } else {
          const updatedProjects = [...allProjects, ...newProjects]
          setAllProjects(updatedProjects)
          setProjects(updatedProjects)
          setFilteredProjects(updatedProjects)
          setDisplayedProjects(updatedProjects.slice(0, (currentPage + 1) * itemsPerPage))
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
      console.error('Error fetching projects:', error)
      if (reset) {
        setProjects([])
        setFilteredProjects([])
        setDisplayedProjects([])
      }
    } finally {
      setLoading(false)
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
    fetchProjects(1, true)
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

  const getUniqueRegions = () => {
    return locations.regions
  }

  const getUniqueCities = () => {
    return locations.cities
  }

  const getUniqueTowns = () => {
    return locations.towns
  }

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

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(project => {
        const clientNames = getNamesFromStakeholders(project.project_clients, 'clientName')
        const contractorNames = getNamesFromStakeholders(project.contractors, 'fullName')
        const serviceNames = getNamesFromStakeholders(project.project_services, 'serviceName')
        
        return (
          project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.project_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clientNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          contractorNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          serviceNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          project.project_location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.project_location?.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.project_location?.country?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_status?.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_priority?.toLowerCase() === priorityFilter.toLowerCase()
      )
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.project_clients, 'clientName').includes(clientFilter)
      )
    }

    if (contractorFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.contractors, 'fullName').includes(contractorFilter)
      )
    }

    if (clerkOfWorkFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.clerk_of_works, 'fullName').includes(clerkOfWorkFilter)
      )
    }

    if (projectServiceFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.project_services, 'serviceName').includes(projectServiceFilter)
      )
    }

    if (buildingTypeFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.building_types, 'buildingType').includes(buildingTypeFilter)
      )
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_location?.region === regionFilter
      )
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_location?.city === cityFilter
      )
    }

    if (townFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_location?.town === townFilter
      )
    }

    if (fundingAgencyFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.funding_agencies, 'agencyName').includes(fundingAgencyFilter)
      )
    }

    if (projectManagerFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.project_managers, 'managerName').includes(projectManagerFilter)
      )
    }

    if (projectCoordinatorFilter !== 'all') {
      filtered = filtered.filter(project => 
        getNamesFromStakeholders(project.project_coordinators, 'fullName').includes(projectCoordinatorFilter)
      )
    }

    setFilteredProjects(filtered)
    setDisplayedProjects(filtered.slice(0, currentPage * itemsPerPage))
  }, [searchTerm, statusFilter, priorityFilter, clientFilter, contractorFilter, clerkOfWorkFilter, projectServiceFilter, buildingTypeFilter, regionFilter, cityFilter, townFilter, fundingAgencyFilter, projectManagerFilter, projectCoordinatorFilter, projects, currentPage, itemsPerPage])

  const handleProjectClick = (project) => {
    setExpandedProject(expandedProject === project.project_id ? null : project.project_id)
  }

  const handleViewProject = (project) => {
    router.push(`/projects/${project.project_slug}/overview`)
  }

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProjects()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore, currentPage])

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

  // Reusable Filter Component
  const FilterComponent = ({ className = "" }) => (
    <div className={`bg-white shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <h6 className="!text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FiFilter className="mr-2" />
        Advanced Filters
      </h6>
      
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Projects
          </label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
                    value={projectServiceFilter}
                    onChange={(e) => setProjectServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Services</option>
                    {getUniqueProjectServices().map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Building Type
                  </label>
                  <select
                    value={buildingTypeFilter}
                    onChange={(e) => setBuildingTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Building Types</option>
                    {getUniqueBuildingTypes().map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location Filters Group */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
          <button
            onClick={() => toggleFilterGroup('location')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-white">Location</span>
            {expandedFilterGroups.location ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
          </button>
          {expandedFilterGroups.location && (
            <div className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Regions</option>
                    {getUniqueRegions().map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Cities</option>
                    {getUniqueCities().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Town
                  </label>
                  <select
                    value={townFilter}
                    onChange={(e) => setTownFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Towns</option>
                    {getUniqueTowns().map(town => (
                      <option key={town} value={town}>{town}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

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
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Clients</option>
                    {getUniqueClients().map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contractor
                  </label>
                  <select
                    value={contractorFilter}
                    onChange={(e) => setContractorFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Contractors</option>
                    {getUniqueContractors().map(contractor => (
                      <option key={contractor} value={contractor}>{contractor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clerk of Works
                  </label>
                  <select
                    value={clerkOfWorkFilter}
                    onChange={(e) => setClerkOfWorkFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Clerk of Works</option>
                    {getUniqueClerkOfWorks().map(cow => (
                      <option key={cow} value={cow}>{cow}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Funding Agency
                  </label>
                  <select
                    value={fundingAgencyFilter}
                    onChange={(e) => setFundingAgencyFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Funding Agencies</option>
                    {getUniqueFundingAgencies().map(agency => (
                      <option key={agency} value={agency}>{agency}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Manager
                  </label>
                  <select
                    value={projectManagerFilter}
                    onChange={(e) => setProjectManagerFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Managers</option>
                    {getUniqueProjectManagers().map(manager => (
                      <option key={manager} value={manager}>{manager}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Coordinator
                  </label>
                  <select
                    value={projectCoordinatorFilter}
                    onChange={(e) => setProjectCoordinatorFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Project Coordinators</option>
                    {getUniqueProjectCoordinators().map(coordinator => (
                      <option key={coordinator} value={coordinator}>{coordinator}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear All Filters Button */}
        <button
          onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setPriorityFilter('all')
            setClientFilter('all')
            setContractorFilter('all')
            setClerkOfWorkFilter('all')
            setProjectServiceFilter('all')
            setBuildingTypeFilter('all')
            setRegionFilter('all')
            setCityFilter('all')
            setTownFilter('all')
            setFundingAgencyFilter('all')
            setProjectManagerFilter('all')
            setProjectCoordinatorFilter('all')
          }}
          className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )

  if (loading) {
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
      {/* Map Toggle */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center flex-wrap">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            Project Dashboard
          </h4>
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
            <div className="h-screen">
              <ProjectMap
                projects={filteredProjects}
                height="100%"
                showPopup={true}
                onMarkerClick={handleProjectClick}
              />
            </div>
          </div>
        )}

        {/* List View Section */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex relative">
              {/* Projects Grid */}
              <div className="flex-1 p-6">
                <div className="flex flex-wrap gap-4">
                  {displayedProjects.map((project) => {
                    const { planned, cumulative } = getProgress(project)
                    const progressActual = cumulative
                    const progressPlanned = planned
                    const duration = displayDuration(project)
                    const remainingDays = calculateRemainingDays(project)
                    const isExpanded = expandedProject === project.project_id
                    
                    return (
                      <div
                        key={project.project_id}
                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)] ${
                          isExpanded ? 'shadow-xl border-blue-300 dark:border-blue-600' : ''
                        }`}
                        onClick={() => handleProjectClick(project)}
                      >
                        {/* Basic Project Info */}
                        <div className="mb-3">
                          <h5 className="font-semibold text-gray-900 dark:text-white !text-sm mb-2">
                            {project.project_name}
                          </h5>
                          <div className="flex items-center space-x-2 !text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <FiMapPin className="text-gray-400" />
                            <span>{project.project_location?.city}, {project.project_location?.region}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 !text-sm font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                              {project.project_status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewProject(project)
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            >
                              <FiEye className="text-sm" />
                            </button>
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
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewProject(project)
                                }}
                                className="w-full px-3 py-2 bg-blue-600 text-white !text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                View Full Project
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Remaining Days */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
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
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading more projects...</p>
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

                {/* No More Projects */}
                {!hasMore && displayedProjects.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You've reached the end of the projects list
                    </p>
                  </div>
                )}
                
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
          <div className="absolute top-0 z-800 left-0 w-1/3 bg-white/10 backdrop-blur-md max-h-[95%] overflow-y-auto dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <h6 className="font-semibold text-gray-900 dark:text-white mb-4">
                All Projects ({filteredProjects.length})
              </h6>
              
              <div className="space-y-4">
                {displayedProjects.map((project) => {
                  const { planned, cumulative } = getProgress(project)
                  const progressActual = cumulative
                  const progressPlanned = planned
                  const duration = displayDuration(project)
                  const remainingDays = calculateRemainingDays(project)
                  const isExpanded = expandedProject === project.project_id
                  
                  return (
                    <div
                      key={project.project_id}
                      className={`bg-gray-50 max-w-sm dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-all duration-300 cursor-pointer ${
                        isExpanded ? 'shadow-xl border-blue-300 dark:border-blue-600' : ''
                      }`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            {project.project_name}
                          </h6>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <FiMapPin className="text-gray-400" />
                            <span>{project.project_location?.city}, {project.project_location?.region}</span>
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
                          >
                            <FiEye className="text-sm" />
                          </button>
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

                          {/* Action Button */}
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewProject(project)
                              }}
                              className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Full Project
                            </button>
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
                })}
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
