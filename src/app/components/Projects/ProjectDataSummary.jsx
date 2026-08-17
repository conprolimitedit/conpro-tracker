import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import DataCard from '../DataCard'
import { STATUS_CARD_CONFIG } from '../../lib/projectStatuses'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const SummaryCardSkeleton = () => (
  <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-900/40 p-4 animate-pulse min-h-[120px]">
    <div className="flex items-center justify-between mb-4">
      <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-600" />
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-600" />
    </div>
    <div className="flex justify-center">
      <div className="h-10 w-16 rounded-lg bg-gray-200 dark:bg-gray-600" />
    </div>
  </div>
)

const ProjectDataSummary = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
  }, [])

  const total = summary?.total_projects || 0
  const shareOfTotal = (count) => {
    if (!total) return '0%'
    return `${Math.round((Number(count) / total) * 100)}%`
  }

  const dataCards = summary
    ? [
        {
          title: 'Total Projects',
          value: summary.total_projects,
          icon: 'trending',
          color: 'blue',
          shareLabel: '100%',
        },
        ...Object.entries(STATUS_CARD_CONFIG)
          .filter(([status]) => (summary[status] || 0) > 0)
          .map(([status, config]) => ({
            title: config.label,
            value: summary[status] || 0,
            icon: config.icon,
            color: config.color,
            shareLabel: shareOfTotal(summary[status] || 0),
          })),
      ]
    : []

  if (loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SummaryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-center items-center min-h-[120px] rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4">
          <div className="text-red-600 dark:text-red-400 text-center">
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
          nextEl: '.project-summary-next',
          prevEl: '.project-summary-prev',
        }}
        pagination={{
          clickable: true,
          el: '.project-summary-pagination',
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
        className="project-summary-swiper relative px-6"
      >
        {dataCards.map((card, index) => (
          <SwiperSlide key={index} className="!h-auto">
            <DataCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              shareLabel={card.shareLabel}
            />
          </SwiperSlide>
        ))}

        <button
          type="button"
          aria-label="Previous status cards"
          className="project-summary-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next status cards"
          className="project-summary-next absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="project-summary-pagination !relative !mt-4 !bottom-0 flex justify-center" />
      </Swiper>
    </div>
  )
}

export default ProjectDataSummary
