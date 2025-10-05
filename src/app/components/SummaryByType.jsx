"use client"
import React, { useMemo, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { projects, buildingTypes } from '../Data/Data'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { FiChevronLeft, FiChevronRight, FiMapPin, FiUser, FiDollarSign } from 'react-icons/fi'

const SummaryByType = () => {
  const router = useRouter()

  const containersRef = useRef({})
  const getContainerRef = (key) => {
    if (!containersRef.current[key]) {
      containersRef.current[key] = React.createRef()
    }
    return containersRef.current[key]
  }

  // Scroll-reveal setup
  const sectionRefs = useRef({})
  const [visibleSections, setVisibleSections] = useState({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionKey = entry.target.getAttribute('data-section')
          if (entry.isIntersecting && sectionKey) {
            setVisibleSections((prev) => ({ ...prev, [sectionKey]: true }))
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )

    Object.entries(sectionRefs.current).forEach(([, el]) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollByAmount = (key, amount) => {
    const el = containersRef.current[key]?.current
    if (el) {
      el.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  const fallbackImages = [
    'https://images.unsplash.com/photo-1441457355775-b04a0f7aa64f?w=1000&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&h=600&fit=crop',
    'https://images.unsplash.com/photo-1487956382158-bb926046304a?w=1000&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=1000&h=600&fit=crop',
    'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1000&h=600&fit=crop',
    'https://images.unsplash.com/photo-1483356256511-b48749959172?w=1000&h=600&fit=crop'
  ]

  const getCoverImage = (seed) => {
    const hash = Array.from(String(seed) || '')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return fallbackImages[hash % fallbackImages.length]
  }

  const projectsByType = useMemo(() => {
    const byType = new Map()
    buildingTypes.forEach((bt) => byType.set(bt.name, []))
    projects.forEach((project) => {
      ;(project.buildingTypes || []).forEach((bt) => {
        const key = bt.name
        if (!byType.has(key)) byType.set(key, [])
        byType.get(key).push(project)
      })
    })
    return Array.from(byType.entries()).filter(([, list]) => list.length > 0)
  }, [])

  const handleViewProject = (project) => {
    router.push(`/projects/${project.slug}/overview`)
  }

  const slugify = (txt) => String(txt).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
    } catch (e) {
      return amount?.toLocaleString?.() || String(amount)
    }
  }

  const getStatusClasses = (status) => {
    const s = String(status || '').toLowerCase()
    if (s.includes('completed')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
    if (s.includes('progress')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
    if (s.includes('planning')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
    if (s.includes('hold')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  }

  if (!projectsByType.length) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300">No projects available.</div>
    )
  }

  return (
    <div className="space-y-8">
      {projectsByType.map(([typeName, list], sectionIndex) => {
        const navPrev = `nav-prev-${slugify(typeName)}`
        const navNext = `nav-next-${slugify(typeName)}`
        return (
          <section
            key={typeName}
            ref={(el) => { sectionRefs.current[typeName] = el }}
            data-section={typeName}
            className={`rounded-2xl p-5 border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm transform transition-all duration-700 ease-out ${visibleSections[typeName] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${Math.min(sectionIndex * 80, 320)}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold bg-clip-text text-primary_color">{typeName}</h3>
            </div>

            <div className="relative">
              {/* Gradient edges */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10"></div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10"></div>

              {/* Overlay nav buttons */}
              <button
                className={`${navPrev} ${list.length < 2 ? 'hidden' : ''} absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow-md ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 transition`}
                aria-label={`Previous ${typeName}`}
              >
                <FiChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              </button>
              <button
                className={`${navNext} ${list.length < 2 ? 'hidden' : ''} absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/80 shadow-md ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 transition`}
                aria-label={`Next ${typeName}`}
              >
                <FiChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              </button>

              <Swiper
                modules={[Navigation, Pagination, A11y]}
                spaceBetween={24}
                navigation={{ prevEl: `.${navPrev}`, nextEl: `.${navNext}` }}
                pagination={{ clickable: true }}
                slidesPerView={'auto'}
              >
                {list.map((project) => (
                  <SwiperSlide key={project.id} style={{ width: '300px' }}>
                    <div
                      className="relative bg-white/90 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer ring-1 ring-transparent hover:ring-blue-200 dark:hover:ring-blue-800"
                      onClick={() => handleViewProject(project)}
                    >
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={getCoverImage(project.id)}
                          alt={`${project.name} cover`}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                      </div>

                      <div className="p-4">
                        <h4 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {project.name}
                        </h4>
                        <div className="mb-2">
                          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full ${getStatusClasses(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                          <p className="truncate flex items-center gap-1"><FiUser className="h-3.5 w-3.5 text-gray-400" /><span className="text-gray-500 dark:text-gray-400">Client:</span> {project.client?.name || '—'}</p>
                          <p className="truncate flex items-center gap-1"><FiMapPin className="h-3.5 w-3.5 text-gray-400" /><span className="text-gray-500 dark:text-gray-400">Location:</span> {project.location?.city || '—'}</p>
                          <p className="truncate flex items-center gap-1"><FiDollarSign className="h-3.5 w-3.5 text-gray-400" /><span className="text-gray-500 dark:text-gray-400">Budget:</span> {formatCurrency(project.budget)}</p>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default SummaryByType
