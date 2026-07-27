'use client'
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { FiSearch, FiEye, FiEdit } from 'react-icons/fi'

/**
 * Autocomplete for project search. Typing stays local — does not notify parent
 * on every keystroke (avoids remounting the dashboard / map).
 * Parent reads the current value via ref.getValue() on Apply Filters.
 */
const ProjectSearchDropdown = forwardRef(function ProjectSearchDropdown(
  {
    value = '',
    onSelect,
    canEdit = false,
    onPreview,
    onEdit,
    placeholder = 'Search by project or institution...',
  },
  ref
) {
  const [term, setTerm] = useState(value || '')
  const [debounced, setDebounced] = useState(term)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef(null)
  const skipNextFetchRef = useRef(false)
  const termRef = useRef(term)

  useImperativeHandle(ref, () => ({
    getValue: () => termRef.current,
    setValue: (next) => {
      const v = next || ''
      termRef.current = v
      setTerm(v)
      setDebounced(v)
      setResults([])
      setOpen(false)
    },
    clear: () => {
      termRef.current = ''
      setTerm('')
      setDebounced('')
      setResults([])
      setOpen(false)
    },
  }), [])

  // Sync from parent only when applied/cleared value changes externally
  useEffect(() => {
    const next = value || ''
    if (next !== termRef.current) {
      termRef.current = next
      setTerm(next)
      setDebounced(next)
      setResults([])
      setOpen(false)
    }
  }, [value])

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 300)
    return () => clearTimeout(id)
  }, [term])

  useEffect(() => {
    let cancelled = false
    const fetchResults = async () => {
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false
        setResults([])
        setLoading(false)
        return
      }
      if (!debounced || debounced.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', limit: '10', search: debounced })
        const res = await fetch(`/api/projects?${params.toString()}`)
        const data = await res.json()
        if (!cancelled) {
          setResults((data.projects || []).slice(0, 10))
        }
      } catch (e) {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchResults()
    return () => {
      cancelled = true
    }
  }, [debounced])

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toLower = (s) => (s || '').toLowerCase()

  const handleChange = (e) => {
    const next = e.target.value
    termRef.current = next
    setTerm(next)
    setOpen(true)
    if (next === '') {
      setResults([])
    }
  }

  const handleSelect = useCallback((project) => {
    const selected = project.project_name || project.institution_name || ''
    const t =
      debounced && project.project_name && toLower(project.project_name).includes(toLower(debounced))
        ? 'project'
        : debounced && project.institution_name && toLower(project.institution_name).includes(toLower(debounced))
          ? 'institution'
          : 'project'
    skipNextFetchRef.current = true
    termRef.current = selected
    setTerm(selected)
    setDebounced(selected)
    setOpen(false)
    setResults([])
    onSelect?.({
      type: t,
      value: selected,
      slug: project.project_slug,
      id: project.project_id,
    })
  }, [onSelect, debounced])

  return (
    <div className="relative" ref={rootRef}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        value={term}
        onChange={handleChange}
        onFocus={() => {
          if (term.length >= 2) setOpen(true)
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        autoComplete="off"
      />
      {open && term.length >= 2 && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-start justify-between gap-2 p-2">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-2/5" />
                  </div>
                  <div className="flex gap-1 shrink-0 pt-0.5">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded" />
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          ) : (
            results.map((p) => {
              const isProject = debounced && toLower(p.project_name || '').includes(toLower(debounced))
              const isInstitution =
                debounced && toLower(p.institution_name || '').includes(toLower(debounced))
              const badge = isProject ? 'Project' : isInstitution ? 'Institution' : ''
              return (
                <div
                  key={p.project_id}
                  onClick={() => handleSelect(p)}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {p.project_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="line-clamp-1">{p.institution_name}</span>
                      {badge && (
                        <span
                          className={`px-1 py-0.5 rounded text-[10px] shrink-0 ${
                            isProject
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreview?.(p)
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-gray-600"
                      title="Preview Project"
                      aria-label="Preview Project"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit?.(p)
                        }}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1.5 rounded hover:bg-green-50 dark:hover:bg-gray-600"
                        title="Edit Project"
                        aria-label="Edit Project"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
})

export default ProjectSearchDropdown
