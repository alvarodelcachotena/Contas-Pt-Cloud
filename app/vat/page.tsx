'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Calculator, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface VATEntry {
  id: number
  period: string
  totalSales: number
  totalPurchases: number
  vatCollected: number
  vatPaid: number
  vatDue: number
  status: string
  dueDate: string
}

export default function VATPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: vatData, isLoading } = useQuery({
    queryKey: ['/api/vat'],
    queryFn: async () => {
      const response = await fetch('/api/vat')
      if (!response.ok) throw new Error('Failed to fetch VAT entries')
      return response.json()
    }
  })

  // Mock VAT entries for the UI since API returns different structure
  const mockVatEntries: VATEntry[] = [
    {
      id: 1,
      period: '2025-01',
      totalSales: 25000,
      totalPurchases: 15000,
      vatCollected: 5750,
      vatPaid: 3400,
      vatDue: 2350,
      status: 'pendente',
      dueDate: '2025-02-28'
    },
    {
      id: 2,
      period: '2024-12',
      totalSales: 28500,
      totalPurchases: 18200,
      vatCollected: 6555,
      vatPaid: 4186,
      vatDue: 2369,
      status: 'pago',
      dueDate: '2025-01-31'
    },
    {
      id: 3,
      period: '2024-11',
      totalSales: 22800,
      totalPurchases: 16400,
      vatCollected: 5244,
      vatPaid: 3772,
      vatDue: 1472,
      status: 'pago',
      dueDate: '2024-12-31'
    }
  ]

  const filteredEntries = mockVatEntries.filter(entry =>
    entry.period.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t.vat.title}</h1>
                <p className="text-muted-foreground">{t.vat.subtitle}</p>
              </div>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>{t.vat.newDeclaration}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.vat.metrics.vatToPay}
                  </CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">€2.350,00</div>
                  <p className="text-xs text-muted-foreground">
                    {t.vat.metrics.currentPeriod}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.vat.metrics.vatCollected}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€5.750,00</div>
                  <p className="text-xs text-muted-foreground">
                    {t.vat.metrics.thisMonth}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.vat.metrics.vatPaid}
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">€3.400,00</div>
                  <p className="text-xs text-muted-foreground">
                    {t.vat.metrics.thisMonth}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.vat.metrics.declarations}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    {t.vat.metrics.thisYear}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>{t.vat.declarations.title}</span>
                </CardTitle>
                <CardDescription>
                  {filteredEntries.length} declaração{filteredEntries.length !== 1 ? 'ões' : ''} encontrada{filteredEntries.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t.vat.declarations.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.period}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.sales}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.purchases}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.vatCollected}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.vatPaid}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.vatDue}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t.vat.declarations.status}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredEntries.map((entry) => (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-foreground">{entry.period}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">€{entry.totalSales.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">€{entry.totalPurchases.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-green-600">€{entry.vatCollected.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-orange-600">€{entry.vatPaid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">€{entry.vatDue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={entry.status === 'pago' ? 'default' : 'destructive'}>
                                {entry.status === 'pago' ? t.vat.status.paid : t.vat.status.pending}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}