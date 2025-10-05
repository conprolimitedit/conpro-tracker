'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import jwt from 'jsonwebtoken'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('user')
        if (storedToken) {
          setToken(storedToken)
          // Verify token and fetch fresh user data from database
          await verifyToken(storedToken)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear invalid token
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Verify token and fetch user data
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          return true
        }
      }
      
      // Token is invalid, remove it
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      return false
    } catch (error) {
      console.error('Token verification error:', error)
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      return false
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        const { token: newToken, user: userData } = data
        
        // Store ONLY the token in localStorage as 'user'
        localStorage.setItem('user', newToken)
        setToken(newToken)
        
        // Set user data from database response (not stored in localStorage)
        setUser(userData)
        
        console.log('✅ Login successful - Token stored, user data fetched from database')
        return { success: true, user: userData }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  // Logout function
  const logout = () => {
    // Remove ONLY the token from localStorage
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    console.log('✅ Logout successful - Token removed from localStorage')
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.userRole === role
  }

  // Check if user is admin
  const isAdmin = () => {
    return user?.userRole === 'admin'
  }

  // Check if user is active
  const isActive = () => {
    return user?.status === 'active'
  }

  // Get user display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.email || 'User'
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isActive,
    getDisplayName,
    getInitials,
    verifyToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
