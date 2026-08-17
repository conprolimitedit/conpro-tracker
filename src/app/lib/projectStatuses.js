/** Canonical project status values stored on projects.project_status */
export const PROJECT_STATUS_OPTIONS = [
  { value: 'yet-to-start', label: 'Yet to Start', summaryKey: 'yet_to_start' },
  { value: 'design', label: 'Design', summaryKey: 'design' },
  { value: 'planning', label: 'Planning', summaryKey: 'planning' },
  { value: 'in-progress', label: 'In Progress', summaryKey: 'in_progress' },
  { value: 'completed', label: 'Completed', summaryKey: 'completed' },
  { value: 'on-hold', label: 'On Hold', summaryKey: 'on_hold' },
  { value: 'terminated', label: 'Terminated', summaryKey: 'terminated' },
  { value: 'abandoned', label: 'Abandoned', summaryKey: 'abandoned' },
  { value: 'cancelled', label: 'Cancelled', summaryKey: 'cancelled' },
]

/** Map any stored status string to the summary column / count key */
export function statusToColumn(status) {
  if (!status || typeof status !== 'string') return null
  return status.toLowerCase().trim().replace(/\s+/g, '-').replace(/-/g, '_')
}

/** Normalize UI/filter values to the hyphenated form used in forms */
export function normalizeStatusValue(status) {
  if (!status || typeof status !== 'string') return status
  const key = statusToColumn(status)
  const match = PROJECT_STATUS_OPTIONS.find((o) => o.summaryKey === key)
  return match ? match.value : status.toLowerCase().trim().replace(/\s+/g, '-')
}

export const STATUS_CARD_CONFIG = {
  yet_to_start: { icon: 'upcoming', color: 'blue', label: 'Yet to Start' },
  design: { icon: 'pending', color: 'purple', label: 'Design' },
  planning: { icon: 'upcoming', color: 'purple', label: 'Planning' },
  in_progress: { icon: 'pending', color: 'yellow', label: 'In Progress' },
  completed: { icon: 'completed', color: 'green', label: 'Completed' },
  on_hold: { icon: 'abandoned', color: 'red', label: 'On Hold' },
  terminated: { icon: 'abandoned', color: 'red', label: 'Terminated' },
  abandoned: { icon: 'abandoned', color: 'red', label: 'Abandoned' },
  cancelled: { icon: 'abandoned', color: 'red', label: 'Cancelled' },
}

/** Empty counts object for all known summary keys */
export function emptyStatusCounts() {
  return PROJECT_STATUS_OPTIONS.reduce(
    (acc, opt) => {
      acc[opt.summaryKey] = 0
      return acc
    },
    { total_projects: 0 }
  )
}

/** Aggregate status counts from a list of { project_status } rows */
export function aggregateStatusCounts(projects = []) {
  const counts = emptyStatusCounts()
  counts.total_projects = projects.length

  for (const project of projects) {
    const key = statusToColumn(project.project_status)
    if (key && Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] += 1
    }
  }
  return counts
}
