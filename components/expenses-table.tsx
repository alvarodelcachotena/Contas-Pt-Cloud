'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FormModal } from '@/components/ui/modal'
import { Search, Plus, FileText, AlertCircle, Download, Eye } from 'lucide-react'

interface Expense {
  id: number
  vendor: string
  amount: number
  vatAmount: number | null
  vatRate: number | null
  category: string
  description: string | null
  receiptNumber: string | null
  expenseDate: string
  isDeductible: boolean
  createdAt: string
}

export default function ExpensesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    vatRate: '23',
    category: '',
    description: '',
    receiptNumber: ''
  })

  const queryClient = useQueryClient()

  const { data: expenses, isLoading, error: queryError } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      console.log('🔍 Fetching expenses from API...')
      const response = await fetch('/api/expenses', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`Failed to fetch expenses: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Expenses data received:', data)
      return data
    }
  })

  const filteredExpenses = expenses?.filter(expense =>
    expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Debug logging (moved after filteredExpenses is defined)
  console.log('🔍 Expenses state:', { expenses, isLoading, queryError })
  console.log('🔍 Filtered expenses:', filteredExpenses)

  const handleOpenModal = () => {
    setFormData({
      vendor: '',
      amount: '',
      vatRate: '23',
      category: '',
      description: '',
      receiptNumber: ''
    })
    setError(null) // Limpiar errores anteriores
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      vendor: '',
      amount: '',
      vatRate: '23',
      category: '',
      description: '',
      receiptNumber: ''
    })
    setError(null) // Limpiar errores al cerrar
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation without alerts
    if (!formData.vendor.trim()) {
      setError('Nome do fornecedor é obrigatório')
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      setError('Valor deve ser um número válido')
      return
    }
    if (!formData.category.trim()) {
      setError('Categoria é obrigatória')
      return
    }
    if (!['6', '13', '23', '0'].includes(formData.vatRate)) {
      setError('Taxa de IVA inválida. Use 0, 6, 13 ou 23')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate VAT amount
      const baseAmount = Number(formData.amount)
      const vatAmount = baseAmount * (Number(formData.vatRate) / 100)

      const newExpense = {
        vendor: formData.vendor,
        amount: baseAmount,
        vatAmount: Number(formData.vatRate) > 0 ? vatAmount : 0,
        vatRate: Number(formData.vatRate),
        category: formData.category,
        description: formData.description || null,
        receiptNumber: formData.receiptNumber || null,
        expenseDate: new Date().toISOString().split('T')[0],
        isDeductible: true
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar despesa')
      }

      // Despesa criada com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/expenses'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar despesa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!expenses || expenses.length === 0) {
        setError('Não há despesas para exportar')
        return
      }

      // Generate CSV content
      const csvContent = [
        ['Fornecedor', 'Valor', 'IVA', 'Taxa IVA', 'Categoria', 'Data', 'Dedutível', 'Descrição', 'Nº Recibo'].join(','),
        ...expenses.map((expense) => [
          `"${expense.vendor}"`,
          expense.amount,
          expense.vatAmount || 0,
          expense.vatRate || 0,
          `"${expense.category}"`,
          expense.expenseDate,
          expense.isDeductible ? 'Sim' : 'Não',
          `"${expense.description || ''}"`,
          `"${expense.receiptNumber || ''}"`
        ].join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `despesas_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      console.log('✅ Despesas exportadas com sucesso')
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError('Erro ao exportar despesas')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
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
          <h1 className="text-3xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground mt-1">Gestão e controlo de despesas</p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Despesa</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Procurar despesas..."
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
          <span>Exportar</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Dedutível</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhuma despesa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.vendor}</TableCell>
                  <TableCell>€{parseFloat(expense.amount.toString()).toFixed(2)}</TableCell>
                  <TableCell>
                    {expense.vatAmount ? (
                      <span>€{parseFloat(expense.vatAmount.toString()).toFixed(2)} ({expense.vatRate}%)</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{expense.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(expense.expenseDate).toLocaleDateString('pt-PT')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.isDeductible ? 'default' : 'destructive'}>
                      {expense.isDeductible ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log(`Ver detalhes da despesa: ${expense.vendor}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Total: {filteredExpenses.length} despesa(s) •
        Valor Total: €{filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0).toFixed(2)}
      </div>

      {/* Modal de Nova Despesa */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        title="Nova Despesa"
        submitLabel="Criar Despesa"
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
              <Label htmlFor="vendor" className="block mb-1">
                Nome do Fornecedor *
              </Label>
              <Input
                id="vendor"
                name="vendor"
                type="text"
                value={formData.vendor}
                onChange={handleInputChange}
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount" className="block mb-1">
                Valor (€) *
              </Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de IVA *
              </label>
              <select
                id="vatRate"
                name="vatRate"
                value={formData.vatRate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="0">0% (Isento)</option>
                <option value="6">6% (Reduzida)</option>
                <option value="13">13% (Intermédia)</option>
                <option value="23">23% (Normal)</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Ex: Alimentação, Transporte, Material"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Número do Recibo
              </label>
              <Input
                id="receiptNumber"
                name="receiptNumber"
                type="text"
                value={formData.receiptNumber}
                onChange={handleInputChange}
                placeholder="Número do recibo (opcional)"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Input
                id="description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrição da despesa (opcional)"
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  )
}