'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Tenant {
  id: string
  name: string
  nif: string
}

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check localStorage first for client-side persistence
      const storedAuth = localStorage.getItem('auth')
      if (storedAuth) {
        const authData = JSON.parse(storedAuth)
        setUser(authData.user)
        
        // If tenant is missing, set the default DIAMOND NXT TRADING LDA tenant
        if (!authData.tenant && authData.user) {
          const defaultTenant = {
            id: '1',
            name: 'DIAMOND NXT TRADING LDA',
            nif: '517124548'
          }
          authData.tenant = defaultTenant
          localStorage.setItem('auth', JSON.stringify(authData))
          setTenant(defaultTenant)
        } else {
          setTenant(authData.tenant)
        }
        
        setIsLoading(false)
        return
      }

      // Fallback to server check with auth headers
      const authHeaders = getAuthHeaders()
      const response = await fetch('/api/auth/status', {
        headers: authHeaders
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.isAuthenticated) {
          setUser(data.user)
          setTenant(data.tenant)
          // Store in localStorage for persistence
          localStorage.setItem('auth', JSON.stringify({
            user: data.user,
            tenant: data.tenant
          }))
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuthHeaders = (): Record<string, string> => {
    const storedAuth = localStorage.getItem('auth')
    if (!storedAuth) return {}

    const authData = JSON.parse(storedAuth)
    const headers: Record<string, string> = {}
    
    if (authData.user || authData.tenant) {
      headers['authorization'] = 'authenticated'
      
      if (authData.user?.id) headers['x-user-id'] = String(authData.user.id)
      if (authData.user?.email) headers['x-user-email'] = String(authData.user.email)
      if (authData.user?.name) headers['x-user-name'] = String(authData.user.name)
      if (authData.user?.role) headers['x-user-role'] = String(authData.user.role)
      if (authData.tenant?.id) headers['x-tenant-id'] = String(authData.tenant.id)
      if (authData.tenant?.name) headers['x-tenant-name'] = String(authData.tenant.name)
      if (authData.tenant?.nif) headers['x-tenant-nif'] = String(authData.tenant.nif)
    }
    
    return headers
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      setUser(data.user)
      setTenant(data.tenant)
      
      // Store authentication data in localStorage for persistence
      localStorage.setItem('auth', JSON.stringify({
        user: data.user,
        tenant: data.tenant
      }))
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear client-side data regardless of API call result
      setUser(null)
      setTenant(null)
      setIsLoading(false)
      
      // Clear localStorage
      localStorage.removeItem('auth')
      localStorage.clear() // Clear all localStorage items
      
      // Clear any stored session data and cookies
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Force immediate redirect to login page
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
  }

  const value = {
    user,
    tenant,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}