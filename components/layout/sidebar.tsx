'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  UserCircle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Faturas', href: '/invoices', icon: FileText },
  { name: 'Despesas', href: '/expenses', icon: Receipt },
  { name: 'Pagamentos', href: '/payments', icon: CreditCard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Documentos', href: '/documents', icon: Folder },
  { name: 'Bancos', href: '/banking', icon: Building2 },
  { name: 'IVA', href: '/vat', icon: Calculator },
  { name: 'SAF-T', href: '/saft', icon: FileSpreadsheet },
  { name: 'Relatórios', href: '/reports', icon: TrendingUp },
  { name: 'Assistente IA', href: '/ai-assistant', icon: Bot },
  { name: 'Drives na Nuvem', href: '/cloud-drives', icon: Cloud },
  { name: 'Webhooks', href: '/webhooks-monitoring', icon: Activity },
  { name: 'Admin', href: '/admin', icon: Settings },
  { name: 'Perfil', href: '/user-settings', icon: UserCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="portuguese-sidebar flex flex-col w-64 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-foreground">Contas-PT</h1>
        <p className="text-sm text-muted-foreground mt-1">Sistema de Contabilidade</p>
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
          <p>© 2025 Contas-PT</p>
          <p>v2.0 - Next.js</p>
        </div>
      </div>
    </div>
  )
}