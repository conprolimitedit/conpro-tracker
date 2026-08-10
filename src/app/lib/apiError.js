/**
 * Turn Supabase / Postgres errors into user-facing messages.
 */
export function humanizeDbError(error) {
  if (!error) return 'Unknown database error'

  const message = error.message || String(error)
  const details = error.details || ''
  const hint = error.hint || ''
  const code = error.code || ''
  const combined = `${message} ${details} ${hint}`

  if (code === '23505' || /duplicate key|unique constraint/i.test(combined)) {
    if (/project_slug|slug/i.test(combined)) {
      return 'A project with this slug already exists. Change the project name or slug and try again.'
    }
    if (/project_name|name/i.test(combined)) {
      return 'A project with this name already exists. Use a different project name.'
    }
    return `This record already exists (${details || message}).`
  }

  if (code === '23503' || /foreign key/i.test(combined)) {
    return `Invalid related selection (${details || message}). Check clients, contractors, or other linked fields.`
  }

  if (code === '23502' || /null value.*violates not-null/i.test(combined)) {
    return `A required database field is missing (${details || message}).`
  }

  if (code === '22P02' || /invalid input syntax/i.test(combined)) {
    return `Invalid data format (${details || message}). Check dates and IDs.`
  }

  if (code === '42501' || /permission denied|rls/i.test(combined)) {
    return 'You do not have permission to perform this action.'
  }

  return message
}

/**
 * Build a toast-friendly message from an API JSON body.
 */
export function formatApiErrorPayload(data, fallback = 'Request failed') {
  if (!data || typeof data !== 'object') return fallback

  const parts = [data.error, data.details, data.message]
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => p.trim())

  const unique = [...new Set(parts)]
  if (unique.length === 0) return fallback
  if (unique.length === 1) return unique[0]
  // Avoid "Failed to create project — Failed to create project"
  if (unique[0] === unique[1]) return unique[0]
  return `${unique[0]} — ${unique.slice(1).join(' — ')}`
}

/**
 * Read an error message from a fetch Response (handles non-JSON bodies).
 */
export async function getErrorMessageFromResponse(response, fallback = 'Request failed') {
  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (data) {
    return formatApiErrorPayload(
      data,
      `${fallback} (HTTP ${response.status}${response.statusText ? `: ${response.statusText}` : ''})`
    )
  }

  return `${fallback} (HTTP ${response.status}${response.statusText ? `: ${response.statusText}` : ''})`
}

/**
 * Friendly message for network / client-side fetch failures.
 */
export function getClientErrorMessage(error, action = 'complete the request') {
  if (!error) return `Could not ${action}.`
  const msg = error.message || String(error)
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return `Network error while trying to ${action}. Check your internet connection and try again.`
  }
  if (/json/i.test(msg) && /unexpected|parse/i.test(msg)) {
    return `The server returned an unexpected response while trying to ${action}.`
  }
  return msg
}
