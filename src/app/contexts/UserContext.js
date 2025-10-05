'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Custom hook for role-based access
export const useRole = () => {
  const { user, getUserRole, isAdmin, isUser, hasRole } = useUser()
  
  return {
    role: getUserRole(),
    isAdmin: isAdmin(),
    isUser: isUser(),
    hasRole,
    user
  }
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('Error loading user from storage:', error)
        // Clear invalid user data
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  // Helper functions for role-based access
  const getUserRole = () => {
    return user?.role || null
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isUser = () => {
    return user?.role === 'user'
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const value = {
    user,
    loading,
    login,
    logout,
    getUserRole,
    isAdmin,
    isUser,
    hasRole
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
