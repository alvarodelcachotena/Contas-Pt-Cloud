'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Calculator, TrendingUp, TrendingDown, FileText, Trash2, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface VATEntry {
  period: string
  totalSales: number
  totalPurchases: number
  vatCollected: number
  vatPaid: number
  vatDue: number
  status: string
}

interface VATData {
  records: VATEntry[]
  currentMonth: {
    totalSales: number
    totalPurchases: number
    vatCollected: number
    vatPaid: number
    vatDue: number
  }
  summary: {
    totalVatToPay: number
    totalVatCollected: number
    totalVatPaid: number
    declarationsCount: number
  }
  calculationDetails?: {
    whatsappVATRecords: number
    vatCalculationMethod: string
    dataSource: string
    error?: string
  }
}

export default function VATPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'all' | 'individual', period?: string } | null>(null)

  const { data: vatData, isLoading } = useQuery<VATData>({
    queryKey: ['/api/vat'],
    queryFn: async () => {
      const response = await fetch('/api/vat', {
        headers: {
          'x-tenant-id': '1' // Hardcoded for now, should come from user context
        }
      })
      if (!response.ok) throw new Error('Failed to fetch VAT data')
      return response.json()
    }
  })

  // Usar datos reales del API
  const vatEntries = vatData?.records || []
  const currentMonthData = vatData?.currentMonth
  const summary = vatData?.summary

  const filteredEntries = vatEntries.filter(entry =>
    entry.period.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para eliminar todos los datos
  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/vat?type=all', {
        method: 'DELETE',
        headers: {
          'x-tenant-id': '1'
        }
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Si es un error de tabla no encontrada, no mostrar error
        if (responseData.message && responseData.message.includes('table does not exist')) {
          console.log('Table does not exist, nothing to delete')
          window.location.reload()
          return
        }
        throw new Error(responseData.error || 'Failed to delete all VAT data')
      }

      // Refrescar los datos
      window.location.reload()
    } catch (error) {
      console.error('Error deleting all VAT data:', error)
      alert('Error al eliminar todos los datos de IVA')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // Función para eliminar datos de un período específico
  const handleDeletePeriod = async (period: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/vat?type=individual&period=${period}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': '1'
        }
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Si es un error de tabla no encontrada, no mostrar error
        if (responseData.message && responseData.message.includes('table does not exist')) {
          console.log('Table does not exist, nothing to delete')
          window.location.reload()
          return
        }
        throw new Error(responseData.error || 'Failed to delete period VAT data')
      }

      // Refrescar los datos
      window.location.reload()
    } catch (error) {
      console.error('Error deleting period VAT data:', error)
      alert('Error al eliminar los datos del período')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

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
                <p className="text-xs text-blue-600 mt-1">
                  📱 Datos generados automáticamente desde WhatsApp
                </p>
                {vatData?.calculationDetails?.error && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ {vatData.calculationDetails.error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm({ type: 'all' })}
                  disabled={isDeleting || filteredEntries.length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar Todo
                </Button>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>{t.vat.newDeclaration}</span>
                </Button>
              </div>
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
                  <div className="text-2xl font-bold text-red-600">
                    €{summary?.totalVatToPay?.toFixed(2) || '0.00'}
                  </div>
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
                  <div className="text-2xl font-bold text-green-600">
                    €{summary?.totalVatCollected?.toFixed(2) || '0.00'}
                  </div>
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
                  <div className="text-2xl font-bold text-orange-600">
                    €{summary?.totalVatPaid?.toFixed(2) || '0.00'}
                  </div>
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
                  <div className="text-2xl font-bold">
                    {summary?.declarationsCount || 0}
                  </div>
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
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-medium">No hay datos de IVA disponibles</p>
                      <p className="text-sm">Los datos de IVA se generan automáticamente desde las facturas procesadas por WhatsApp</p>
                    </div>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredEntries.map((entry, index) => (
                          <tr key={`${entry.period}-${index}`} className="border-b hover:bg-muted/50">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteConfirm({ type: 'individual', period: entry.period })}
                                disabled={isDeleting}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </Button>
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

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {deleteConfirm.type === 'all' ? 'Eliminar Todos los Datos' : 'Eliminar Período'}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {deleteConfirm.type === 'all'
                ? '¿Estás seguro de que quieres eliminar TODOS los datos de IVA de WhatsApp? Esta acción no se puede deshacer.'
                : `¿Estás seguro de que quieres eliminar los datos de IVA del período ${deleteConfirm.period}? Esta acción no se puede deshacer.`
              }
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm.type === 'all') {
                    handleDeleteAll()
                  } else if (deleteConfirm.period) {
                    handleDeletePeriod(deleteConfirm.period)
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}