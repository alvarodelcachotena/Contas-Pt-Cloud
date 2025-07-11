'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Company {
  id: string
  name: string
  nif: string
  address: string
  role: string
}

export default function CompanySwitcher() {
  const { user, tenant } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCompanies()
    }
  }, [user])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const storedAuth = localStorage.getItem('auth')
      if (!storedAuth) return

      const authData = JSON.parse(storedAuth)
      const headers: Record<string, string> = {
        'authorization': 'authenticated'
      }
      
      if (authData.user?.id) headers['x-user-id'] = String(authData.user.id)
      if (authData.user?.email) headers['x-user-email'] = String(authData.user.email)
      if (authData.user?.name) headers['x-user-name'] = String(authData.user.name)
      if (authData.user?.role) headers['x-user-role'] = String(authData.user.role)
      if (authData.tenant?.id) headers['x-tenant-id'] = String(authData.tenant.id)
      if (authData.tenant?.name) headers['x-tenant-name'] = String(authData.tenant.name)
      if (authData.tenant?.nif) headers['x-tenant-nif'] = String(authData.tenant.nif)

      const response = await fetch('/api/user/companies', {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchCompany = async (company: Company) => {
    try {
      // Update the tenant in localStorage
      const storedAuth = localStorage.getItem('auth')
      if (storedAuth) {
        const authData = JSON.parse(storedAuth)
        authData.tenant = {
          id: company.id,
          name: company.name,
          nif: company.nif
        }
        localStorage.setItem('auth', JSON.stringify(authData))
        
        // Reload the page to update the context throughout the app
        window.location.reload()
      }
    } catch (error) {
      console.error('Error switching company:', error)
    }
  }

  if (!user || !tenant) {
    return (
      <div className="px-4 py-2 border-b border-border">
        <div className="text-sm text-muted-foreground text-center">
          ⚠️ Por favor, faça login novamente
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-2 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-2 hover:bg-accent"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium text-sm text-foreground truncate max-w-[140px]">
                  {tenant.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  NIF: {tenant.nif} • admin
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuLabel>Empresas Disponíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {loading ? (
            <DropdownMenuItem disabled>
              Carregando empresas...
            </DropdownMenuItem>
          ) : companies.length > 0 ? (
            companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => switchCompany(company)}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-2 w-full">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm truncate">
                      {company.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      NIF: {company.nif} • {company.role}
                    </div>
                  </div>
                  {tenant.id === company.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              Nenhuma empresa disponível
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}