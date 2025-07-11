'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const { user, tenant, logout } = useAuth()

  return (
    <header className="portuguese-header px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {tenant?.name || 'Sistema de Contabilidade Português'}
            </h2>
            {tenant?.nif && (
              <p className="text-sm text-muted-foreground">NIF: {tenant.nif}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3 px-3 py-2 bg-card rounded-lg border border-border">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {user.name || user.email}
                </span>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                {user.role}
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </header>
  )
}