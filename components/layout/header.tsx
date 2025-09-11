'use client'

import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import LanguageSelector from '@/components/language-selector'

export default function Header() {
  const { user, tenant, logout } = useAuth()
  const { t } = useLanguage()

  return (
    <header className="portuguese-header px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {tenant?.name || t.navbar.systemName}
            </h2>
            {tenant?.nif && (
              <p className="text-sm text-muted-foreground">NIF: {tenant.nif}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector />

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
            <span>{t.navbar.logout}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}