"use client"

import React, { useState } from 'react'

const page = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // File upload states
    const [uploadLoading, setUploadLoading] = useState(false)
    const [uploadError, setUploadError] = useState(null)
    const [uploadSuccess, setUploadSuccess] = useState(null)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [healthCheck, setHealthCheck] = useState(null)

    const handleClick = async () => {
        console.log("🚀 Button clicked - fetching all users...")
        console.log("📍 Current URL:", window.location.href)
        
        setLoading(true)
        setError(null)
        
        try {
            // Make sure we're making a proper client-side fetch request
            const apiUrl = `${window.location.origin}/api/test-users`
            console.log("🔗 Full API URL:", apiUrl)
            console.log("📡 Making client-side fetch request...")
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add cache control to ensure fresh request
                cache: 'no-cache'
            })
            
            console.log("📡 Response received:", response)
            console.log("📡 Response status:", response.status)
            console.log("📡 Response ok:", response.ok)
            console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log("📡 Response data:", data)
            
            if (data.success) {
                console.log('✅ API Response:', data)
                setUsers(data.users || [])
            } else {
                console.error('❌ API Error:', data)
                setError(data.error || 'Failed to fetch users')
            }
        } catch (err) {
            console.error('💥 Fetch error:', err)
            setError('Network error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTestUser = async () => {
        console.log("🚀 Creating test user...")
        setLoading(true)
        setError(null)
        
        try {
            const apiUrl = `${window.location.origin}/api/test-users`
            console.log("🔗 Full API URL:", apiUrl)
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache'
            })
            
            console.log("📡 Response received:", response)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log("📡 Response data:", data)
            
            if (data.success) {
                console.log('✅ Test user created:', data)
                // Refresh the users list
                await handleClick()
            } else {
                console.error('❌ API Error:', data)
                setError(data.error || 'Failed to create test user')
            }
        } catch (err) {
            console.error('💥 Create user error:', err)
            setError('Network error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        console.log("🚀 Uploading file:", file.name)
        console.log("📁 File size:", file.size, "bytes")
        console.log("📁 File type:", file.type)
        
        setUploadLoading(true)
        setUploadError(null)
        setUploadSuccess(null)
        setUploadedFile(null)
        
        try {
            // Create FormData for file upload
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'conproProjectsBucket')
            
            const apiUrl = `${window.location.origin}/api/upload-file`
            console.log("🔗 Upload API URL:", apiUrl)
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - let browser set it with boundary
                cache: 'no-cache'
            })
            
            console.log("📡 Upload response:", response)
            console.log("📡 Upload response status:", response.status)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log("📡 Upload response data:", data)
            
            if (data.success) {
                console.log('✅ File uploaded successfully:', data)
                setUploadSuccess('File uploaded successfully!')
                setUploadedFile(data.fileData)
            } else {
                console.error('❌ Upload Error:', data)
                setUploadError(data.error || 'Failed to upload file')
            }
        } catch (err) {
            console.error('💥 Upload error:', err)
            setUploadError('Upload error: ' + err.message)
        } finally {
            setUploadLoading(false)
        }
    }

    const handleHealthCheck = async () => {
        console.log("🔍 Running health check...")
        
        try {
            const apiUrl = `${window.location.origin}/api/upload-file`
            console.log("🔗 Health check URL:", apiUrl)
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache'
            })
            
            console.log("📡 Health check response:", response)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log("📡 Health check data:", data)
            
            setHealthCheck(data)
        } catch (err) {
            console.error('💥 Health check error:', err)
            setHealthCheck({
                success: false,
                error: 'Health check failed: ' + err.message
            })
        }
    }

  return (
    <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test API - Users & File Upload</h1>
        
        {/* Users Section */}
        <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Users API Test</h2>
            <div className="flex gap-4 mb-6">
                <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md disabled:opacity-50" 
                    onClick={handleClick}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Fetch All Users'}
                </button>
                
                <button 
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md disabled:opacity-50" 
                    onClick={handleCreateTestUser}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Test User'}
                </button>
            </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">File Upload Test</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
                <div className="mb-4">
                    <div className="flex gap-4 mb-4">
                        <button 
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm"
                            onClick={handleHealthCheck}
                        >
                            🔍 Health Check API
                        </button>
                    </div>
                    
                    {healthCheck && (
                        <div className={`mb-4 p-4 rounded-lg ${healthCheck.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                            <strong>Health Check Result:</strong>
                            <pre className="mt-2 text-xs overflow-auto">
                                {JSON.stringify(healthCheck, null, 2)}
                            </pre>
                        </div>
                    )}
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a file to upload to conproProjectsBucket:
                    </label>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadLoading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                </div>
                
                {uploadLoading && (
                    <div className="text-blue-600 mb-4">
                        <div className="inline-flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Uploading file...
                        </div>
                    </div>
                )}
                
                {uploadError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Upload Error:</strong> {uploadError}
                    </div>
                )}
                
                {uploadSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <strong>Success!</strong> {uploadSuccess}
                    </div>
                )}
                
                {uploadedFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Uploaded File Details:</h3>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <strong className="text-gray-700">File Name:</strong>
                                    <p className="text-gray-600">{uploadedFile.name}</p>
                                </div>
                                <div>
                                    <strong className="text-gray-700">File Size:</strong>
                                    <p className="text-gray-600">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <div>
                                    <strong className="text-gray-700">File Type:</strong>
                                    <p className="text-gray-600">{uploadedFile.type}</p>
                                </div>
                                <div>
                                    <strong className="text-gray-700">Uploaded At:</strong>
                                    <p className="text-gray-600">{new Date(uploadedFile.uploadedAt).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <strong className="text-gray-700">Public URL:</strong>
                                <div className="mt-2 p-3 bg-white border rounded-lg">
                                    <a 
                                        href={uploadedFile.publicUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 break-all"
                                    >
                                        {uploadedFile.publicUrl}
                                    </a>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <strong className="text-gray-700">Full Response Object:</strong>
                                <pre className="mt-2 p-3 bg-white border rounded-lg overflow-auto text-xs">
                                    {JSON.stringify(uploadedFile, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
            </div>
        )}

        {users.length > 0 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <strong>Success!</strong> Found {users.length} user(s) in the database.
            </div>
        )}

        {users.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                    <h2 className="text-lg font-semibold">Users from Database</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {users.length === 0 && !loading && !error && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                <strong>Ready to test!</strong> Click the button above to fetch users from the database.
            </div>
        )}

        {users.length === 0 && !loading && !error && users.length !== undefined && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mt-4">
                <strong>No users found!</strong> The database query was successful, but there are no users in the 'users' table. 
                <br />This means either:
                <ul className="list-disc list-inside mt-2">
                    <li>The users table is empty</li>
                    <li>You need to create some test users first</li>
                    <li>Check your Supabase dashboard to see if the table exists</li>
                </ul>
            </div>
        )}
    </div>
  )
}

export default page
