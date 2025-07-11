function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  
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

export async function apiRequest(url: string, options: RequestInit = {}) {
  const authHeaders = getAuthHeaders()
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response
}

// Query client for TanStack Query
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey
        return apiRequest(url as string)
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
  },
})