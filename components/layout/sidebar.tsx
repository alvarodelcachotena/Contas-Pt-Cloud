'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/hooks/useLanguage'
import CompanySwitcher from '@/components/company-switcher'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Folder,
  Building2,
  Calculator,
  FileSpreadsheet,
  TrendingUp,
  Bot,
  Cloud,
  Activity,
  Settings,
  UserCircle,
  Truck
} from 'lucide-react'

const getNavigation = (t: any) => [
  { name: t.sidebar.navigation.dashboard, href: '/', icon: LayoutDashboard },
  { name: t.sidebar.navigation.invoices, href: '/invoices', icon: FileText },
  { name: t.sidebar.navigation.expenses, href: '/expenses', icon: Receipt },
  { name: t.sidebar.navigation.income, href: '/income', icon: CreditCard },
  { name: t.sidebar.navigation.clients, href: '/clients', icon: Users },
  { name: t.sidebar.navigation.suppliers, href: '/suppliers', icon: Truck },
  { name: t.sidebar.navigation.documents, href: '/documents', icon: Folder },
  { name: t.sidebar.navigation.banking, href: '/banking', icon: Building2 },
  { name: t.sidebar.navigation.vat, href: '/vat', icon: Calculator },
  { name: t.sidebar.navigation.saft, href: '/saft', icon: FileSpreadsheet },
  { name: t.sidebar.navigation.reports, href: '/reports', icon: TrendingUp },
  { name: t.sidebar.navigation.aiAssistant, href: '/ai-assistant', icon: Bot },
  { name: t.sidebar.navigation.cloudDrives, href: '/cloud-drives', icon: Cloud },
  { name: t.sidebar.navigation.webhooks, href: '/webhooks-monitoring', icon: Activity },
  { name: t.sidebar.navigation.admin, href: '/admin', icon: Settings },
  { name: t.sidebar.navigation.profile, href: '/user-settings', icon: UserCircle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const navigation = getNavigation(t)

  return (
    <div className="portuguese-sidebar flex flex-col w-64 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-foreground">{t.sidebar.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.sidebar.subtitle}</p>
      </div>

      <CompanySwitcher />

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'nav-item',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-muted-foreground">
          <p>{t.sidebar.footer.copyright}</p>
          <p>{t.sidebar.footer.version}</p>
        </div>
      </div>
    </div>
  )
}