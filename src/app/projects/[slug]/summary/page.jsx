'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FiCalendar, FiClock, FiTrendingUp, FiClipboard, FiUser, FiUsers } from 'react-icons/fi'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, isAfter, parseISO } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ProjectTimeLine from '@/app/components/Projects/ProjectTimeLine'

// Custom CSS overrides for React Big Calendar
const calendarStyles = `
  .rbc-calendar {
    height: 100% !important;
    font-family: inherit !important;
  }
  .rbc-toolbar {
    background: transparent !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 8px 0 !important;
    margin-bottom: 16px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
  }
  .rbc-toolbar button {
    background: #f3f4f6 !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
    padding: 6px 12px !important;
    border-radius: 6px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    margin: 0 2px !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    z-index: 10 !important;
    position: relative !important;
  }
  .rbc-toolbar button:hover {
    background: #e5e7eb !important;
    border-color: #9ca3af !important;
  }
  .rbc-toolbar button:active {
    background: #d1d5db !important;
    transform: translateY(1px) !important;
  }
  .rbc-toolbar button.rbc-active {
    background: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: white !important;
  }
  .rbc-toolbar-label {
    font-weight: 600 !important;
    font-size: 14px !important;
    color: #374151 !important;
  }
  .rbc-header {
    background: #f9fafb !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 8px 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #374151 !important;
  }
  .rbc-month-view {
    border: 1px solid #e5e7eb !important;
  }
  .rbc-date-cell {
    padding: 4px !important;
    font-size: 11px !important;
    cursor: pointer !important;
  }
  .rbc-off-range-bg {
    background: #f9fafb !important;
  }
  .rbc-today {
    background: #eff6ff !important;
  }
  .rbc-event {
    border-radius: 4px !important;
    padding: 2px 4px !important;
    font-size: 10px !important;
    font-weight: 500 !important;
    border: none !important;
    cursor: pointer !important;
  }
  .rbc-event-content {
    color: white !important;
    font-size: 10px !important;
  }
  .dark .rbc-toolbar {
    border-bottom-color: #374151 !important;
  }
  .dark .rbc-toolbar button {
    background: #374151 !important;
    border-color: #4b5563 !important;
    color: #d1d5db !important;
  }
  .dark .rbc-toolbar button:hover {
    background: #4b5563 !important;
    border-color: #6b7280 !important;
  }
  .dark .rbc-toolbar button.rbc-active {
    background: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: white !important;
  }
  .dark .rbc-toolbar-label {
    color: #d1d5db !important;
  }
  .dark .rbc-header {
    background: #1f2937 !important;
    border-bottom-color: #374151 !important;
    color: #d1d5db !important;
  }
  .dark .rbc-month-view {
    border-color: #374151 !important;
  }
  .dark .rbc-off-range-bg {
    background: #1f2937 !important;
  }
  .dark .rbc-today {
    background: #1e3a8a !important;
  }
`

// Utility to compute progress from statuses
const computeProgressPercent = (items) => {
  const total = items.length
  if (total === 0) return 0
  const completed = items.filter(p => (p.status || '').toLowerCase() === 'completed').length
  return Math.round((completed / total) * 100)
}

// Color helper based on status / deadlines
const getStatusStyles = (status) => {
  const normalized = (status || '').toLowerCase()
  switch (normalized) {
    case 'completed':
      return { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
    case 'in-progress':
      return { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' }
    case 'on-hold':
      return { badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' }
    case 'cancelled':
      return { badge: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400' }
    case 'upcoming':
      return { badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' }
    default:
      return { badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
  }
}

const ProjectSummaryPage = () => {
  const params = useParams()
  const { slug } = params
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')

  // Fetch project metadata
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        console.log('🚀 Fetching project data for slug:', slug)
        
        const response = await fetch(`/api/projects/slug/${slug}`)
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ Project data fetched:', data.project)
          setProjectData(data.project)
        } else {
          console.error('❌ Error fetching project data:', data.error)
        }
      } catch (error) {
        console.error('❌ Error fetching project data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug && slug !== 'addNewProject') {
      fetchProjectData()
    }
  }, [slug])

  // Build phases from real project metadata
  const phases = useMemo(() => {
    if (!projectData?.meta_data?.phases) return []
    
    const phasesData = projectData.meta_data.phases
    const phaseOrder = [
      'advert', 'eoi', 'rfp', 'conceptual', 'specification', 'bill-of-quantities',
      'structural-designs', 'meep', 'award-letter', 'acceptance-letter', 'signing',
      'consultant-inception', 'consultant-progress-reports', 'consultant-site-meeting-minutes',
      'consultant-invoice-claims', 'consultant-handing-over', 'consultant-defect-liability',
      'consultant-final-account', 'contractor-mobilization', 'contractor-progress-reports',
      'contractor-site-meeting-minutes', 'contractor-ipcs', 'contractor-handing-over',
      'contractor-defect-liability', 'contractor-final-account'
    ]

    return phaseOrder.map((phaseKey, index) => {
      const phaseData = phasesData[phaseKey]
      if (!phaseData) return null

      const phaseName = phaseKey.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')

      return {
        id: phaseKey,
        name: phaseName,
        status: phaseData.phase_status || 'unsubmitted',
        deadline: phaseData.phase_deadline,
        start: phaseData.phase_deadline, // Use deadline as start for calendar
        phaseKey: phaseKey
      }
    }).filter(Boolean)
  }, [projectData])

  // Build sub-phase events from real data
  const subPhaseEvents = useMemo(() => {
    if (!phases.length) return []
    
    return phases.map(phase => {
      // Skip phases without deadlines
      if (!phase.deadline || phase.deadline === 'No deadline set') return null
      
      const startDate = parseISO(phase.deadline)
      const endDate = parseISO(phase.deadline)
      const isPast = !isAfter(endDate, new Date())
      const status = phase.status.toLowerCase()
      const formattedDeadline = format(endDate, 'yyyy-MM-dd')
      
      return {
        title: `${phase.name} - ${formattedDeadline}${isPast ? ' (Overdue)' : ''}`,
        start: startDate,
        end: endDate,
        resource: { status, isPast },
      }
    }).filter(Boolean)
  }, [phases])

  // Build sub-phase objects for summary and progress from real data
  const subPhases = useMemo(() => {
    if (!phases.length) return []
    
    return phases.map(phase => {
      // Handle null/empty deadlines safely
      let endDate = null
      let isPast = false
      
      if (phase.deadline && phase.deadline !== 'No deadline set') {
        try {
          endDate = parseISO(phase.deadline)
          isPast = !isAfter(endDate, new Date())
        } catch (error) {
          console.warn(`Invalid date format for phase ${phase.name}: ${phase.deadline}`)
          endDate = null
          isPast = false
        }
      }
      
      // Determine phase category
      let category = null
      if (phase.phaseKey.includes('consultant')) {
        category = 'consultant'
      } else if (phase.phaseKey.includes('contractor')) {
        category = 'contractor'
      }
      
      // Determine main phase
      let mainPhase = 'pre-contract'
      if (phase.phaseKey.includes('consultant') || phase.phaseKey.includes('contractor')) {
        mainPhase = 'post-contract'
      }
      
      return {
        id: phase.id,
        name: phase.name,
        status: phase.status.toLowerCase(),
        deadline: phase.deadline || 'No deadline set',
        phase: mainPhase,
        category: category,
        isPast: isPast,
        phaseKey: phase.phaseKey
      }
    })
  }, [phases])

  // Calendar localizer
  const locales = { 'en-US': enUS }
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
    getDay,
    locales,
  })

  // Events for calendar (use start..deadline range)
  const events = useMemo(() => {
    const phaseEvents = phases.map(p => {
      // Skip phases without deadlines
      if (!p.start || !p.deadline) return null
      
      const startDate = parseISO(p.start)
      const endDate = parseISO(p.deadline)
      const isPast = !isAfter(endDate, new Date())
      const formattedDeadline = format(endDate, 'yyyy-MM-dd')
      return {
        title: `${p.name} - ${formattedDeadline}${isPast ? ' (Overdue)' : ''}`,
        start: startDate,
        end: endDate,
        resource: { status: p.status, isPast },
      }
    }).filter(Boolean) // Remove null entries
    
    const allEvents = [...phaseEvents, ...subPhaseEvents]
    
    // Filter out invalid events and ensure all have required properties
    const validEvents = allEvents.filter(event => {
      return event && 
             event.title && 
             event.start && 
             event.end &&
             typeof event.title === 'string' &&
             event.title.trim().length > 0
    }).map(event => ({
      ...event,
      title: event.title.trim(),
      resource: {
        status: event.resource?.status || 'unsubmitted',
        isPast: event.resource?.isPast || false
      }
    }))
    
    console.log('📅 Calendar events:', validEvents)
    
    // Add test events if no real events exist (for testing navigation)
    if (validEvents.length === 0) {
      const today = new Date()
      const testEvents = [
        {
          title: 'Test Event - Today',
          start: today,
          end: today,
          resource: { status: 'completed', isPast: false }
        },
        {
          title: 'Test Event - Tomorrow',
          start: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          resource: { status: 'in-progress', isPast: false }
        }
      ]
      console.log('📅 Using test events for navigation testing')
      return testEvents
    }
    
    return validEvents
  }, [phases, subPhaseEvents])

  // Progress from sub-phases completion
  const progressPercent = computeProgressPercent(subPhases)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading project summary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Inject custom CSS */}
      {/* <ProjectTimeLine /> */}
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      
      {/* Header */}
      <div className="flex justify-between items-start flex-col mb-6 px-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
          <FiCalendar className="mr-2" /> Project Summary
        </h2>
        {projectData && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {projectData.project_name || slug}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-24">
        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Overall Progress</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Based on phases marked Completed</p>
            </div>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <FiTrendingUp />
              <span className="font-medium">{progressPercent}%</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Timeline (Custom Project Timeline Component) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiCalendar className="mr-2 text-blue-600" />
              Phase Deadlines & Timeline
            </h5>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {events.length > 0 ? `${events.length} deadline${events.length !== 1 ? 's' : ''}` : 'No deadlines set'}
            </div>
          </div>
          <div className="h-[600px] overflow-y-auto">
            <ProjectTimeLine 
              projectData={projectData}
              phases={phases}
              events={events}
            />
          </div>
        </div>

        {/* Sub-Phase Summary – Modern layout */}
        {(() => {
          const pre = subPhases.filter(p => p.phase === 'pre-contract')
          const cons = subPhases.filter(p => p.phase === 'post-contract' && p.category === 'consultant')
          const cont = subPhases.filter(p => p.phase === 'post-contract' && p.category === 'contractor')
          const stat = (list) => ({
            total: list.length,
            completed: list.filter(i => i.status === 'completed').length,
          })
          const preStat = stat(pre)
          const consStat = stat(cons)
          const contStat = stat(cont)
          const pct = (s) => (s.total ? Math.round((s.completed / s.total) * 100) : 0)

          return (
            <div className="mt-6 space-y-6">
              {/* Pre-Contract – full width */}
              {pre.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <FiClipboard className="text-blue-600 dark:text-blue-300" />
                      </div>
                      <h6 className="text-sm font-semibold text-gray-900 dark:text-white">Pre-Contract Phases</h6>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-gray-600 dark:text-gray-400">{preStat.completed}/{preStat.total} completed</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{pct(preStat)}%</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${pct(preStat)}%` }} />
                  </div>
                  <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                    {pre.map((sp) => {
                      const styles = getStatusStyles(sp.status)
                      return (
                        <div key={sp.id} className="py-2.5 flex items-center justify-between">
                          <div className="text-xs text-gray-900 dark:text-gray-100">{sp.name}</div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles.badge}`}>{sp.status || 'unknown'}</span>
                            <span className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center">
                              <FiCalendar className="mr-1" /> {sp.deadline} {sp.isPast ? '(Overdue)' : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Post-Contract – split consultant and contractor */}
              {(cons.length > 0 || cont.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {cons.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <FiUser className="text-emerald-600 dark:text-emerald-300" />
                          </div>
                          <h6 className="text-sm font-semibold text-gray-900 dark:text-white">Post-Contract – Consultant Phases</h6>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-gray-600 dark:text-gray-400">{consStat.completed}/{consStat.total} completed</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{pct(consStat)}%</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-emerald-600 rounded-full" style={{ width: `${pct(consStat)}%` }} />
                      </div>
                      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                        {cons.map((sp) => {
                          const styles = getStatusStyles(sp.status)
                          return (
                            <div key={sp.id} className="py-2.5 flex items-center justify-between">
                              <div className="text-xs text-gray-900 dark:text-gray-100">{sp.name}</div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles.badge}`}>{sp.status || 'unknown'}</span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center">
                                  <FiCalendar className="mr-1" /> {sp.deadline} {sp.isPast ? '(Overdue)' : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {cont.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                            <FiUsers className="text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <h6 className="text-sm font-semibold text-gray-900 dark:text-white">Post-Contract – Contractor Phases</h6>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-gray-600 dark:text-gray-400">{contStat.completed}/{contStat.total} completed</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{pct(contStat)}%</span>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-indigo-600 rounded-full" style={{ width: `${pct(contStat)}%` }} />
                      </div>
                      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                        {cont.map((sp) => {
                          const styles = getStatusStyles(sp.status)
                          return (
                            <div key={sp.id} className="py-2.5 flex items-center justify-between">
                              <div className="text-xs text-gray-900 dark:text-gray-100">{sp.name}</div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles.badge}`}>{sp.status || 'unknown'}</span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center">
                                  <FiCalendar className="mr-1" /> {sp.deadline} {sp.isPast ? '(Overdue)' : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Sticky footer spacer */}
      <div className="h-6" />
    </div>
  )
}

export default ProjectSummaryPage


