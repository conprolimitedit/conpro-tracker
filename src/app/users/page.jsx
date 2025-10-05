'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    userRole: '',
    status: 'active',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        console.log('✅ Users fetched successfully:', data.users.length)
      } else {
        console.error('❌ Error fetching users:', data.error)
        toast.error(data.error || 'Failed to fetch users', {
          position: "top-right",
          autoClose: 4000,
        })
        setUsers([])
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      toast.error('Error fetching users', {
        position: "top-right",
        autoClose: 4000,
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return
    }

    // Check if user is authenticated and is admin
    if (!user) {
      router.push('/')
      return
    }

    if (!isAdmin()) {
      router.push('/projects')
      return
    }

    // Load users if user is admin
    fetchUsers()
  }, [user, authLoading, router])

  const handleEditUser = (user) => {
    setEditingUser(user)
    setEditForm({
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      userRole: user.userRole,
      status: user.status || 'active',
      password: '',
      confirmPassword: ''
    })
    setMessage('')
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditForm({
      email: '',
      firstName: '',
      lastName: '',
      userRole: '',
      status: 'active',
      password: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveUser = async () => {
    if (!editForm.email) {
      toast.error('Email is required', {
        position: "top-right",
        autoClose: 4000,
      })
      return
    }

    if (!editForm.userRole) {
      toast.error('User role is required', {
        position: "top-right",
        autoClose: 4000,
      })
      return
    }

    if (editingUser === 'new' && !editForm.password) {
      toast.error('Password is required for new users', {
        position: "top-right",
        autoClose: 4000,
      })
      return
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error('Passwords do not match', {
        position: "top-right",
        autoClose: 4000,
      })
      return
    }

    if (editForm.password && editForm.password.length < 6) {
      toast.error('Password must be at least 6 characters', {
        position: "top-right",
        autoClose: 4000,
      })
      return
    }

    setIsLoading(true)

    try {
      if (editingUser === 'new') {
        // Create new user
        const createData = {
          email: editForm.email,
          password: editForm.password,
          userRole: editForm.userRole,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          status: editForm.status
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createData)
        })

        const data = await response.json()

        if (data.success) {
          toast.success('User created successfully!', {
            position: "top-right",
            autoClose: 4000,
          })
          
          // Refresh users list
          await fetchUsers()
          
          setEditingUser(null)
          setEditForm({
            email: '',
            firstName: '',
            lastName: '',
            userRole: '',
            status: 'active',
            password: '',
            confirmPassword: ''
          })
          setShowPassword(false)
          setShowConfirmPassword(false)
        } else {
          toast.error(data.error || 'Error creating user. Please try again.', {
            position: "top-right",
            autoClose: 4000,
          })
        }
      } else {
        // Update existing user
        const updateData = {
          userId: editingUser.id,
          email: editForm.email,
          userRole: editForm.userRole,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          status: editForm.status
        }

        // Only include password if it's provided
        if (editForm.password) {
          updateData.password = editForm.password
        }

        const response = await fetch('/api/users/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        const data = await response.json()

        if (data.success) {
          toast.success('User updated successfully!', {
            position: "top-right",
            autoClose: 4000,
          })
          
          // Refresh users list
          await fetchUsers()
          
          setEditingUser(null)
          setEditForm({
            email: '',
            firstName: '',
            lastName: '',
            userRole: '',
            status: 'active',
            password: '',
            confirmPassword: ''
          })
          setShowPassword(false)
          setShowConfirmPassword(false)
        } else {
          toast.error(data.error || 'Error updating user. Please try again.', {
            position: "top-right",
            autoClose: 4000,
          })
        }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error saving user. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = (user) => {
    setConfirmationModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}"? This action cannot be undone and will permanently remove the user account.`,
      onConfirm: () => confirmDeleteUser(user),
      isLoading: false
    })
  }

  const confirmDeleteUser = async (user) => {
    setConfirmationModal(prev => ({ ...prev, isLoading: true }))
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/update?id=${user.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`User "${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}" has been deleted successfully!`, {
          position: "top-right",
          autoClose: 4000,
        })
        
        // Refresh users list
        await fetchUsers()
        
        // Close modal
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
      } else {
        toast.error(data.error || 'Error deleting user. Please try again.', {
          position: "top-right",
          autoClose: 4000,
        })
        setConfirmationModal(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      })
      setConfirmationModal(prev => ({ ...prev, isLoading: false }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    
    setConfirmationModal({
      isOpen: true,
      type: 'warning',
      title: 'Change User Status',
      message: `Are you sure you want to change "${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}" status from ${user.status} to ${newStatus}?`,
      onConfirm: () => confirmToggleStatus(user, newStatus),
      isLoading: false
    })
  }

  const confirmToggleStatus = async (user, newStatus) => {
    setConfirmationModal(prev => ({ ...prev, isLoading: true }))
    setIsLoading(true)

    try {
      const updateData = {
        userId: user.id,
        status: newStatus
      }

      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`User "${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}" status changed to ${newStatus} successfully!`, {
          position: "top-right",
          autoClose: 4000,
        })
        
        // Refresh users list
        await fetchUsers()
        
        // Close modal
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }))
      } else {
        toast.error(data.error || 'Error updating user status. Please try again.', {
          position: "top-right",
          autoClose: 4000,
        })
        setConfirmationModal(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Error updating user status. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      })
      setConfirmationModal(prev => ({ ...prev, isLoading: false }))
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'finance':
        return 'bg-green-100 text-green-800'
      case 'projectManager':
        return 'bg-blue-100 text-blue-800'
      case 'architecture':
        return 'bg-purple-100 text-purple-800'
      case 'meep':
        return 'bg-yellow-100 text-yellow-800'
      case 'structural':
        return 'bg-indigo-100 text-indigo-800'
      case 'others':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading while authentication is in progress
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29166F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated and is admin
  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">Manage user accounts, passwords, and email addresses</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditingUser('new')}
                className="px-4 py-2 bg-[#29166F] text-white font-medium rounded-lg hover:bg-[#1e0f5c] transition-colors duration-200"
              >
                Add New User
              </button>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Users ({users.length})</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#29166F]"></div>
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.userRole)}`}>
                            {user.userRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                              title={`Toggle to ${user.status === 'active' ? 'inactive' : 'active'}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-[#29166F] hover:text-[#1e0f5c] transition-colors duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser === 'new' ? 'Add New User' : `Edit User: `}
                  </h3>
                  {editingUser.first_name && editingUser.last_name && (
                    <h3 className="!text-sm font-medium text-gray-900">
                      {editingUser.first_name} {editingUser.last_name}
                    </h3>
                  )}
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Role
                    </label>
                    <select
                      name="userRole"
                      value={editForm.userRole || editingUser.userRole}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="finance">Finance</option>
                      <option value="projectManager">Project Manager</option>
                      <option value="architecture">Architecture</option>
                      <option value="meep">MEEP</option>
                      <option value="structural">Structural</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={editForm.status === 'active'}
                          onChange={handleInputChange}
                          className="mr-2 text-[#29166F] focus:ring-[#29166F]"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="inactive"
                          checked={editForm.status === 'inactive'}
                          onChange={handleInputChange}
                          className="mr-2 text-[#29166F] focus:ring-[#29166F]"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingUser === 'new' ? 'Password' : 'New Password (leave blank to keep current)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={editForm.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                        placeholder={editingUser === 'new' ? 'Enter password' : 'Enter new password'}
                        required={editingUser === 'new'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {(editForm.password || editingUser === 'new') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {editingUser === 'new' ? 'Confirm Password' : 'Confirm New Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={editForm.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29166F] focus:border-transparent"
                          placeholder={editingUser === 'new' ? 'Confirm password' : 'Confirm new password'}
                          required={editingUser === 'new'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                        >
                          {showConfirmPassword ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUser}
                      disabled={isLoading}
                      className="px-6 py-3 text-sm font-medium text-white bg-[#29166F] hover:bg-[#1e0f5c] rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : (editingUser === 'new' ? 'Create User' : 'Save Changes')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          isLoading={confirmationModal.isLoading}
          confirmText={confirmationModal.type === 'danger' ? 'Delete User' : 'Confirm Change'}
          cancelText="Cancel"
        />
      </div>
    </div>
  )
}

export default UsersPage
