'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, differenceInDays } from 'date-fns'
import { projects } from '../../Data/Data'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const ProjectTimeLine = ({ projectData, phases, events: passedEvents }) => {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'day', 'agenda'
  const [currentDate, setCurrentDate] = useState(new Date())


  // Convert phases to calendar events (use passed events or generate from phases)
  const events = useMemo(() => {
    // Prioritize passedEvents over phases to avoid duplicates
    if (passedEvents && passedEvents.length > 0) {
      const generatedEvents = passedEvents.map(event => {
        const deadline = new Date(event.start)
      const today = new Date()
      const daysUntilDeadline = differenceInDays(deadline, today)
      
        let backgroundColor = '#10B981' // Green for completed
      let borderColor = '#059669'
      
        const status = event.resource?.status || 'unsubmitted'
        const isPast = event.resource?.isPast || false
        
        // Color based on status
        if (status === 'completed') {
          backgroundColor = '#10B981' // Green
          borderColor = '#059669'
        } else if (status === 'in-progress') {
          backgroundColor = '#3B82F6' // Blue
          borderColor = '#2563EB'
        } else if (status === 'on-hold') {
          backgroundColor = '#F59E0B' // Orange
          borderColor = '#D97706'
        } else if (status === 'cancelled') {
          backgroundColor = '#6B7280' // Gray
          borderColor = '#4B5563'
        } else {
          backgroundColor = '#EF4444' // Red for unsubmitted/overdue
        borderColor = '#DC2626'
        }
        
        // Make overdue items darker
        if (isPast && status !== 'completed') {
          backgroundColor = '#DC2626'
          borderColor = '#B91C1C'
        }

        return {
          id: event.id || `phase-${Math.random()}`,
          title: event.title,
          start: deadline,
          end: deadline,
          allDay: true,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          textColor: '#FFFFFF',
          resource: {
            ...event.resource,
            phase: event.resource?.phaseKey || 'unknown',
            status: status,
            deadline: event.start
          },
          extendedProps: {
            ...event.resource,
            daysUntilDeadline,
            phase: event.resource?.phaseKey || 'unknown'
          }
        }
      })
      return generatedEvents
    }

    // If no events passed, try to generate from phases data
    if (phases && phases.length > 0) {
      return phases.map(phase => {
        if (!phase.deadline) return null
        
        const deadline = new Date(phase.deadline)
        const today = new Date()
        const daysUntilDeadline = differenceInDays(deadline, today)
        
        let backgroundColor = '#EF4444' // Red for unsubmitted
        let borderColor = '#DC2626'
        
        // Color based on status
        if (phase.status === 'completed') {
          backgroundColor = '#10B981' // Green
          borderColor = '#059669'
        } else if (phase.status === 'in-progress') {
          backgroundColor = '#3B82F6' // Blue
          borderColor = '#2563EB'
        } else if (phase.status === 'on-hold') {
          backgroundColor = '#F59E0B' // Orange
        borderColor = '#D97706'
        } else if (phase.status === 'cancelled') {
          backgroundColor = '#6B7280' // Gray
          borderColor = '#4B5563'
        }
        
        // Make overdue items darker
        if (daysUntilDeadline < 0 && phase.status !== 'completed') {
          backgroundColor = '#DC2626'
          borderColor = '#B91C1C'
      }

      return {
          id: phase.id || `phase-${Math.random()}`,
          title: `${phase.name} - ${format(deadline, 'MMM dd')}`,
        start: deadline,
        end: deadline,
        allDay: true,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: '#FFFFFF',
          resource: {
            phase: phase.name,
            phaseKey: phase.phaseKey,
            status: phase.status,
            deadline: phase.deadline
          },
          extendedProps: {
            phase: phase.name,
            phaseKey: phase.phaseKey,
            status: phase.status,
            deadline: phase.deadline,
            daysUntilDeadline
          }
        }
      }).filter(Boolean)
    }

    // Fallback to dummy data if no events or phases
    const ongoingProjects = projects.filter(project => 
      project.status === 'In Progress' || project.status === 'Planning' || project.status === 'On Hold'
    )

    return ongoingProjects.map(project => {
      const deadline = new Date(project.endDate)
      const today = new Date()
      const daysUntilDeadline = differenceInDays(deadline, today)
      
      let backgroundColor = '#10B981' // Green for on-time
      let borderColor = '#059669'
      
      if (daysUntilDeadline < 0) {
        backgroundColor = '#EF4444' // Red for overdue
        borderColor = '#DC2626'
      } else if (daysUntilDeadline <= 30) {
        backgroundColor = '#F59E0B' // Orange for urgent
        borderColor = '#D97706'
      }

      return {
        id: project.id,
        title: project.name,
        start: deadline,
        end: deadline,
        allDay: true,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: '#FFFFFF',
        resource: project,
        extendedProps: {
          ...project,
          daysUntilDeadline
        }
      }
    })
  }, [passedEvents, phases])



  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const getStatusColor = (daysUntilDeadline) => {
    if (daysUntilDeadline < 0) return 'text-red-600'
    if (daysUntilDeadline <= 30) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusText = (daysUntilDeadline) => {
    if (daysUntilDeadline < 0) return 'Overdue'
    if (daysUntilDeadline <= 30) return 'Urgent'
    return 'On Track'
  }

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        border: `2px solid ${event.borderColor}`,
        color: event.textColor,
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    }
  }

  const messages = {
    allDay: 'All Day',
    previous: 'Previous',
    next: 'Next',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range.',
    showMore: (total) => `+ Show more (${total})`,
  }

  // Handle view change
  const handleViewChange = (newView) => {
    setViewMode(newView)
  }

  // Handle date navigation
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate)
  }


  // Custom toolbar component
  const CustomToolbar = (toolbar) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY')
    }

    const goToPrevious = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const goToView = (newView) => {
      toolbar.onView(newView)
      handleViewChange(newView)
    }

    const isYear = viewMode === 'year'

    return (
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevious}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Previous
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-[#29166F] text-white rounded-md hover:bg-[#1F1147]"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next →
          </button>
        </div>

        <div className="text-lg font-semibold text-gray-900">
          {isYear ? format(toolbar.date, 'yyyy') : format(toolbar.date, 'MMMM yyyy')}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToView('month')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'month'
                ? 'bg-[#29166F] text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => goToView('week')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'week'
                ? 'bg-[#29166F] text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => goToView('day')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'day'
                ? 'bg-[#29166F] text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => goToView('agenda')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'agenda'
                ? 'bg-[#29166F] text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => goToView('year')}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'year'
                ? 'bg-[#29166F] text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Year
          </button>
        </div>
      </div>
    )
  }

  // Custom Year view for react-big-calendar
  const CustomYearView = (props) => {
    const { date, events } = props
    const currentYear = date.getFullYear()
    const now = new Date()
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const getEventsForMonth = (monthIndex) => {
      return events.filter((event) => {
        const eventDate = new Date(event.start)
        return (
          eventDate.getFullYear() === currentYear &&
          eventDate.getMonth() === monthIndex
        )
      })
    }

    const statusPillClass = (daysUntilDeadline) => {
      if (daysUntilDeadline < 0) return 'bg-red-100 text-red-700 border border-red-200'
      if (daysUntilDeadline <= 30) return 'bg-orange-100 text-orange-700 border border-orange-200'
      return 'bg-green-100 text-green-700 border border-green-200'
    }

    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((month, idx) => {
            const monthEvents = getEventsForMonth(idx)
            const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() === idx
            return (
              <div
                key={idx}
                className={`rounded-xl p-4 shadow-sm transition-all border ${
                  isCurrentMonth
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
                    : 'bg-white hover:shadow-md border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-semibold ${isCurrentMonth ? 'text-indigo-900' : 'text-gray-900'}`}>{month}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    monthEvents.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {monthEvents.length} {monthEvents.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                {monthEvents.length > 0 ? (
                  <div className="space-y-2">
                    {monthEvents.map((event) => (
                      <div
                        key={event.id}
                        className="group flex items-start gap-2 p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                        onClick={() => handleEventClick(event)}
                      >
                        <div
                          className="w-1 rounded-full"
                          style={{ backgroundColor: event.borderColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="truncate text-xs font-medium text-gray-900">{event.title}</div>
                            <div className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${statusPillClass(event.extendedProps.daysUntilDeadline)}`}>
                              {getStatusText(event.extendedProps.daysUntilDeadline)}
                            </div>
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-600">
                            Due {format(new Date(event.start), 'MMM dd')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-xs py-6 border border-dashed rounded-lg">
                    No projects
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  CustomYearView.navigate = (date, action) => {
    switch (action) {
      case 'PREV':
        return new Date(date.getFullYear() - 1, 0, 1)
      case 'NEXT':
        return new Date(date.getFullYear() + 1, 0, 1)
      case 'TODAY':
        return new Date()
      default:
        return date
    }
  }
  CustomYearView.title = (date) => format(date, 'yyyy')
  CustomYearView.range = (date) => {
    const start = new Date(date.getFullYear(), 0, 1)
    const end = new Date(date.getFullYear(), 11, 31)
    return [start, end]
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Phase Deadlines Timeline</h2>
          <p className="text-gray-600">Track project phase deadlines and status</p>
        </div>
        <div className="text-sm text-gray-600">
          {events.length} phase{events.length !== 1 ? 's' : ''} with deadlines
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-700">On Hold</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm text-gray-700">Cancelled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Unsubmitted/Overdue</span>
        </div>
      </div>

      {/* Single Calendar with custom views (including Year) */}
      <div className="bg-white rounded-lg border min-h-[800px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 800, minHeight: 800 }}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          views={{
            month: true,
            week: true,
            day: true,
            agenda: true,
            year: CustomYearView,
          }}
          defaultView="month"
          view={viewMode}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          messages={messages}
          components={{
            toolbar: CustomToolbar,
          }}
          popup
        />
      </div>

      {/* Phase Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedEvent.title}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Phase:</span>
                <p className="text-gray-900">{selectedEvent.resource?.phase || 'Unknown Phase'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className={`font-medium ${getStatusColor(selectedEvent.extendedProps.daysUntilDeadline)}`}>
                  {getStatusText(selectedEvent.extendedProps.daysUntilDeadline)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Deadline:</span>
                <p className="text-gray-900">
                  {format(new Date(selectedEvent.start), 'MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Days Until Deadline:</span>
                <p className="text-gray-900">
                  {selectedEvent.extendedProps.daysUntilDeadline > 0 
                    ? `${selectedEvent.extendedProps.daysUntilDeadline} days remaining`
                    : selectedEvent.extendedProps.daysUntilDeadline === 0
                    ? 'Due today'
                    : `${Math.abs(selectedEvent.extendedProps.daysUntilDeadline)} days overdue`
                  }
                </p>
              </div>
              {selectedEvent.resource?.phaseKey && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Phase Key:</span>
                  <p className="text-gray-900">{selectedEvent.resource.phaseKey}</p>
                </div>
              )}
              {projectData && (
              <div>
                  <span className="text-sm font-medium text-gray-500">Project:</span>
                  <p className="text-gray-900">{projectData.project_name || 'Unknown Project'}</p>
              </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-[#29166F] rounded-md hover:bg-[#1F1147]">
                View Phase Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectTimeLine
