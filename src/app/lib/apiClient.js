// API Client with automatic token handling
class ApiClient {
  constructor() {
    this.baseURL = ''
  }

  async request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config)
      
      // If token is expired or invalid, clear it
      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/'
        }
      }

      return response
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  // User-specific methods
  async login(email, password) {
    return this.post('/api/users/login', { email, password })
  }

  async loadUser() {
    return this.get('/api/users/me')
  }

  async logout() {
    return this.post('/api/users/logout')
  }

  async updateUserInfo(userData) {
    return this.put('/api/users/updateInfo', userData)
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient()
export default apiClient
