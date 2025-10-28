# PowerShell script to fix authentication for all content management pages

$pages = @(
    "project-category",
    "project-types", 
    "services",
    "funding-agencies",
    "clerk-of-works",
    "project-managers",
    "project-coordinators"
)

foreach ($page in $pages) {
    $filePath = "src\app\contentManagement\$page\page.jsx"
    Write-Host "Fixing $filePath..."
    
    # Read the file content
    $content = Get-Content $filePath -Raw
    
    # Replace imports
    $content = $content -replace "'use client'`nimport React, \{ useState, useEffect \} from 'react'`nimport ContentCRUD from '../../components/ContentCRUD'", "'use client'`nimport React, { useState, useEffect } from 'react'`nimport { useRouter } from 'next/navigation'`nimport { useAuth } from '../../contexts/AuthContext'`nimport ContentCRUD from '../../components/ContentCRUD'"
    
    # Replace component definition
    $content = $content -replace "const \w+Page = \(\) => \{`n  const \[\w+Data, set\w+Data\] = useState\(\[\]\)`n  const \[loading, setLoading\] = useState\(true\)`n  const \[error, setError\] = useState\(null\)", "const ${page}Page = () => {`n  const router = useRouter()`n  const { user, loading: authLoading, isAuthenticated } = useAuth()`n  const [${page}Data, set${page}Data] = useState([])`n  const [loading, setLoading] = useState(true)`n  const [error, setError] = useState(null)`n`n  useEffect(() => {`n    // Wait for auth to load`n    if (authLoading) return`n    `n    // Role guard: only admin, finance, and project manager`n    if (!isAuthenticated()) {`n      router.replace('/')`n      return`n    }`n    `n    const userRole = user?.userRole`n    if (!userRole || (userRole !== 'admin' && userRole !== 'finance' && userRole !== 'projectManager')) {`n      router.replace('/')`n      return`n    }`n  }, [router, authLoading, isAuthenticated, user])"
    
    # Add auth loading check
    $content = $content -replace "  if \(loading\) \{", "  // Show loading while auth is loading`n  if (authLoading) {`n    return (`n      <div className=`"flex justify-center items-center h-64`">`n        <div className=`"text-lg`">Loading...</div>`n      </div>`n    )`n  }`n`n  if (loading) {"
    
    # Add showActions prop to ContentCRUD
    $content = $content -replace "  return \(`n    <ContentCRUD`n      title=`"[^`"]*`"`n      data=\{[^}]*\}`n      fields=\{fields\}`n      onSave=\{handleSave\}`n      onDelete=\{handleDelete\}`n      searchFields=\{[^}]*\}`n    />`n  \)", "  // Determine if user can perform actions (admin and finance can edit, project manager is read-only)`n  const canEdit = user?.userRole === 'admin' || user?.userRole === 'finance'`n`n  return (`n    <ContentCRUD`n      title=`"$page`"`n      data={${page}Data}`n      fields={fields}`n      onSave={handleSave}`n      onDelete={handleDelete}`n      searchFields={['name']}`n      showActions={canEdit}`n    />`n  )"
    
    # Write the modified content back to the file
    Set-Content $filePath $content -Encoding UTF8
    Write-Host "Fixed $filePath"
}

Write-Host "All pages fixed!"






