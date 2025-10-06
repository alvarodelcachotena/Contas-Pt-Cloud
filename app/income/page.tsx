'use client'

import { useAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/hooks/useLanguage"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FormModal } from "@/components/ui/modal"
import { Search, Plus, Download, CreditCard, AlertCircle, Eye } from "lucide-react"
import DeleteAllButton from "@/components/delete-all-button"

interface Payment {
  id: number
  description: string
  amount: number
  payment_date: string
  reference: string | null
  type: 'income' | 'expense'
  status: string
  created_at: string
}

export default function IncomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    type: '1',
    description: '',
    amount: '',
    method: '1',
    reference: '',
    notes: ''
  })

  const queryClient = useQueryClient()

  // Fetch income from API
  const { data: incomeData, isLoading: incomeLoading, error: queryError } = useQuery<{ payments: Payment[] }>({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments?tenantId=1')
      if (!response.ok) throw new Error('Failed to fetch income')
      return response.json()
    }
  })

  const income = incomeData?.payments || []

  // Filter income based on search term
  const filteredIncome = income.filter(payment =>
    payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate metrics
  const totalIncome = income.filter(p => p.type === 'income').reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = income.filter(p => p.type === 'expense').reduce((sum, p) => sum + Math.abs(p.amount), 0)
  const pendingPayments = income.filter(p => p.status === 'pending').reduce((sum, p) => sum + Math.abs(p.amount), 0)
  const collectionRate = totalIncome > 0 ? ((totalIncome - pendingPayments) / totalIncome * 100).toFixed(0) : '0'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.income.loading}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t.income.status.completed
      case 'pending':
        return t.income.status.pending
      case 'failed':
        return t.income.status.failed
      default:
        return status
    }
  }

  const getTypeLabel = (type: string) => {
    return type === 'income' ? t.income.types.income : t.income.types.expense
  }

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600'
  }

  const handleOpenModal = () => {
    setFormData({
      type: '1',
      description: '',
      amount: '',
      method: '1',
      reference: '',
      notes: ''
    })
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      type: '1',
      description: '',
      amount: '',
      method: '1',
      reference: '',
      notes: ''
    })
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation without alerts
    if (!formData.description.trim()) {
      setError(t.income.errors.descriptionRequired)
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      setError(t.income.errors.amountRequired)
      return
    }
    if (!['1', '2'].includes(formData.type)) {
      setError(t.income.errors.typeInvalid)
      return
    }
    if (!['1', '2', '3', '4'].includes(formData.method)) {
      setError(t.income.errors.methodInvalid)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const methodMap = { '1': 'transfer', '2': 'cash', '3': 'card', '4': 'check' }

      const newPayment = {
        tenantId: 1,
        description: formData.description,
        amount: formData.type === '2' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
        method: methodMap[formData.method as keyof typeof methodMap],
        type: formData.type === '1' ? 'income' : 'expense',
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        reference: formData.reference || null,
        notes: formData.notes || null
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t.income.errors.createError)
      }

      // Pagamento registado com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/payments'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : t.income.errors.createError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!income || income.length === 0) {
        setError(t.income.errors.exportError)
        return
      }

      // Generate CSV content
      const csvContent = [
        ['ID', 'Descrição', 'Valor', 'Tipo', 'Data', 'Referência', 'Estado', 'Método'].join(','),
        ...income.map((payment) => [
          payment.id,
          `"${payment.description}"`,
          payment.amount,
          payment.type,
          payment.payment_date,
          `"${payment.reference || ''}"`,
          payment.status,
          'N/A' // method not stored in DB
        ].join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `pagamentos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      console.log('✅ Pagamentos exportados com sucesso')
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError('Erro ao exportar pagamentos')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Error display for export errors */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Erro!</strong>
                <span className="block sm:inline"> {error}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                  <button onClick={() => setError(null)} className="text-red-700">
                    <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.759 3.152z" /></svg>
                  </button>
                </span>
              </div>
            )}

            {/* Error display for query errors */}
            {queryError && (
              <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Erro na API:</strong>
                <span className="block sm:inline"> {queryError.message}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                  <button onClick={() => window.location.reload()} className="text-orange-700">
                    <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.759 3.152z" /></svg>
                  </button>
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t.income.title}</h1>
                <p className="text-gray-600 mt-1">{t.income.subtitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <DeleteAllButton
                  entityName="pagamento"
                  entityNamePlural="pagamentos"
                  apiEndpoint="/api/payments/delete-all"
                  onSuccess={() => {
                    // Refresh the payments list
                    queryClient.invalidateQueries({ queryKey: ['/api/payments'] })
                  }}
                />
                <Button
                  className="flex items-center space-x-2"
                  onClick={handleOpenModal}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.income.registerIncome}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t.income.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                <span>{t.income.export}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.income.metrics.monthlyIncome}</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">€{totalIncome.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.income.metrics.pendingPayments}</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">€{pendingPayments.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.income.metrics.collectionRate}</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{collectionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {incomeLoading ? (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.income.table.description}</TableHead>
                      <TableHead>{t.income.table.amount}</TableHead>
                      <TableHead>{t.income.table.type}</TableHead>
                      <TableHead>{t.income.table.date}</TableHead>
                      <TableHead>{t.income.table.reference}</TableHead>
                      <TableHead>{t.income.table.status}</TableHead>
                      <TableHead>{t.income.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncome.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t.income.noIncome}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIncome.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.description}</TableCell>
                          <TableCell className={`font-medium ${getTypeColor(payment.type)}`}>
                            {payment.type === 'income' ? '+' : '-'}€{Math.abs(payment.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.type === 'income' ? 'default' : 'secondary'}>
                              {getTypeLabel(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.payment_date).toLocaleDateString('pt-PT')}
                          </TableCell>
                          <TableCell>{payment.reference || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log(`Ver detalhes do pagamento: ${payment.description}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="text-sm text-gray-500">
              {t.income.totalIncome}: {filteredIncome.length} receita(s) •
              {t.income.totalValue}: €{filteredIncome.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Registar Pagamento */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        title={t.income.modal.title}
        submitLabel={t.income.modal.submitLabel}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          {/* Error display in modal */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800 font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="block mb-1">
                {t.income.modal.paymentType} *
              </Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="1">{t.income.types.income}</option>
                <option value="2">{t.income.types.expense}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="method" className="block mb-1">
                {t.income.modal.method} *
              </Label>
              <select
                id="method"
                name="method"
                value={formData.method}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="1">{t.income.methods.transfer}</option>
                <option value="2">{t.income.methods.cash}</option>
                <option value="3">{t.income.methods.card}</option>
                <option value="4">{t.income.methods.check}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t.income.modal.description} *
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descrição do pagamento"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {t.income.modal.amount} *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                {t.income.modal.reference}
              </label>
              <Input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleInputChange}
                placeholder="Referência (opcional)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t.income.modal.notes}
            </label>
            <Input
              id="notes"
              name="notes"
              type="text"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notas adicionais (opcional)"
            />
          </div>

          {/* Preview */}
          {formData.amount && !isNaN(Number(formData.amount)) && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.income.modal.summary}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className={formData.type === '1' ? 'text-green-600' : 'text-red-600'}>
                    {formData.type === '1' ? t.income.types.income : t.income.types.expense}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className={`font-medium ${formData.type === '1' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.type === '1' ? '+' : '-'}€{Number(formData.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  )
}