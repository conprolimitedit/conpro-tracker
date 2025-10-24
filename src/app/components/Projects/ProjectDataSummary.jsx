import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import DataCard from '../DataCard'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const ProjectDataSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch summary data from projects_summary API
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/projects-summary')
        const data = await response.json()
        
        if (data.success) {
          setSummary(data.summary)
        } else {
          setError(data.error || 'Failed to fetch projects summary')
        }
      } catch (err) {
        console.error('Error fetching projects summary:', err)
        setError('Failed to fetch projects summary')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, []) // Only fetch once on mount

  // Define all possible statuses with their configurations
  const statusConfig = {
    'planning': { icon: 'upcoming', color: 'purple', label: 'Planning' },
    'in_progress': { icon: 'pending', color: 'yellow', label: 'In Progress' },
    'completed': { icon: 'completed', color: 'green', label: 'Completed' },
    'on_hold': { icon: 'abandoned', color: 'red', label: 'On Hold' },
    'terminated': { icon: 'abandoned', color: 'red', label: 'Terminated' },
    'abandoned': { icon: 'abandoned', color: 'red', label: 'Abandoned' },
    'cancelled': { icon: 'abandoned', color: 'red', label: 'Cancelled' }
  }
  
  // Calculate trend (mock data for now - in real app this would be from historical data)
  const getTrend = (current, previous = current - 2) => {
    if (current > previous) return { trend: 'up', value: '+12%' }
    if (current < previous) return { trend: 'down', value: '-8%' }
    return { trend: 'stable', value: '0%' }
  }

  // Create data cards from summary data
  const dataCards = summary ? [
    {
      title: "Total Projects",
      value: summary.total_projects,
      icon: "trending",
      color: "blue",
      trend: getTrend(summary.total_projects).trend,
      trendValue: getTrend(summary.total_projects).value
    },
    // Only show status cards that have counts > 0
    ...Object.entries(statusConfig)
      .filter(([status, config]) => summary[status] > 0)
      .map(([status, config]) => ({
        title: config.label,
        value: summary[status],
        icon: config.icon,
        color: config.color,
        trend: getTrend(summary[status]).trend,
        trendValue: getTrend(summary[status]).value
      }))
  ] : []

  if (loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading project summary...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center items-center h-32">
          <div className="text-red-600 text-center">
            <p className="font-medium">Error loading project summary</p>
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
