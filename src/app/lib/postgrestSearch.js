/**
 * Quote a value for safe use inside PostgREST `.or()` filters.
 * Commas, parentheses, spaces, etc. must be quoted or they break filter parsing.
 */
export function quotePostgrestValue(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  return `"${escaped}"`
}

/**
 * Build a PostgREST `.or()` clause for ilike across multiple columns.
 */
export function buildMultiFieldIlikeOr(fields, search) {
  const pattern = quotePostgrestValue(`%${search}%`)
  return fields.map((field) => `${field}.ilike.${pattern}`).join(',')
}

export const PROJECT_SEARCH_FIELDS = [
  'project_name',
  'project_description',
  'institution_name',
  'project_location->>mmda',
  'project_location->>region',
  'project_location->>country',
  'project_location->>address',
  'project_location->>city_town',
]
