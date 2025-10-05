import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import DataCard from '../DataCard'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const ProjectDataSummary = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/projects')
        const data = await response.json()
        
        if (data.success) {
          setProjects(data.projects || [])
        } else {
          setError(data.error || 'Failed to fetch projects')
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Calculate statistics from real project data
  const totalProjects = projects.length
  
  // Group projects by status and count them
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.project_status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Get distinct statuses
  const distinctStatuses = Object.keys(statusCounts)
  
  // Calculate trend (mock data for now - in real app this would be from historical data)
  const getTrend = (current, previous = current - 2) => {
    if (current > previous) return { trend: 'up', value: '+12%' }
    if (current < previous) return { trend: 'down', value: '-8%' }
    return { trend: 'stable', value: '0%' }
  }

  // Create data cards based on actual project statuses
  const dataCards = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: "trending",
      color: "blue",
      trend: getTrend(totalProjects).trend,
      trendValue: getTrend(totalProjects).value
    },
    ...distinctStatuses.map(status => {
      const count = statusCounts[status]
      const statusConfig = {
        'planning': { icon: 'upcoming', color: 'purple', label: 'Planning' },
        'in-progress': { icon: 'pending', color: 'yellow', label: 'In Progress' },
        'completed': { icon: 'completed', color: 'green', label: 'Completed' },
        'on-hold': { icon: 'abandoned', color: 'red', label: 'On Hold' },
        'cancelled': { icon: 'abandoned', color: 'red', label: 'Cancelled' },
        'terminated': { icon: 'abandoned', color: 'red', label: 'Terminated' },
        'abandoned': { icon: 'abandoned', color: 'red', label: 'Abandoned' }
      }
      
      const config = statusConfig[status] || { icon: 'pending', color: 'gray', label: status.charAt(0).toUpperCase() + status.slice(1) }
      
      return {
        title: config.label,
        value: count,
        icon: config.icon,
        color: config.color,
        trend: getTrend(count).trend,
        trendValue: getTrend(count).value
      }
    })
  ]

  if (loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading project data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center items-center h-32">
          <div className="text-red-600 text-center">
            <p className="font-medium">Error loading project data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={12}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          1280: {
            slidesPerView: 5,
            spaceBetween: 16,
          },
        }}
        className="relative"
      >
        {dataCards.map((card, index) => (
          <SwiperSlide key={index}>
            <DataCard 
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              trend={card.trend}
              trendValue={card.trendValue}
            />
          </SwiperSlide>
        ))}
        
        {/* Custom Navigation Buttons */}
        <div className="swiper-button-prev !text-gray-600 !text-sm !w-8 !h-8 !mt-0 !-left-2 !bg-white !rounded-full !shadow-md hover:!bg-gray-50 transition-colors"></div>
        <div className="swiper-button-next !text-gray-600 !text-sm !w-8 !h-8 !mt-0 !-right-2 !bg-white !rounded-full !shadow-md hover:!bg-gray-50 transition-colors"></div>
        
        {/* Custom Pagination */}
        <div className="swiper-pagination !relative !mt-4 !bottom-0"></div>
      </Swiper>
    </div>
  )
}

export default ProjectDataSummary
