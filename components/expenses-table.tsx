'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
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
import { Search, Plus, FileText } from 'lucide-react'

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
  const { tenant } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    category: '',
    description: ''
  })

  const { data: expenses, isLoading, error } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
    queryFn: async () => {
      console.log('Fetching expenses...')
      const response = await fetch('/api/expenses')
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const data = await response.json()
      console.log('Expenses data received:', data)
      return data
    }
  })

  const filteredExpenses = expenses?.filter(expense =>
    expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  console.log('Expenses:', expenses)
  console.log('Filtered expenses:', filteredExpenses)
  console.log('Is loading:', isLoading)
  console.log('Error:', error)
  console.log('Tenant:', tenant)

  const handleOpenModal = () => {
    setFormData({
      vendor: '',
      amount: '',
      category: '',
      description: ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      vendor: '',
      amount: '',
      category: '',
      description: ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.vendor.trim()) {
      alert('Nome do fornecedor é obrigatório')
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      alert('Valor deve ser um número válido')
      return
    }
    if (!formData.category.trim()) {
      alert('Categoria é obrigatória')
      return
    }

    setIsSubmitting(true)
    
    try {
      const newExpense = {
        vendor: formData.vendor,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description || null,
        expenseDate: new Date().toISOString().split('T')[0],
        isDeductible: true
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      })

      if (!response.ok) {
        throw new Error('Erro ao criar despesa')
      }

      alert('Despesa criada com sucesso!')
      handleCloseModal()
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar despesa')
    } finally {
      setIsSubmitting(false)
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
          onClick={() => {
            // Fetch expenses and export as CSV
            fetch('/api/expenses')
              .then(response => response.json())
              .then(data => {
                const csvContent = [
                  ['Fornecedor', 'Valor', 'IVA', 'Categoria', 'Data', 'Dedutível', 'Descrição'].join(','),
                  ...data.map((expense: any) => [
                    `"${expense.vendor}"`,
                    expense.amount,
                    expense.vatAmount || 0,
                    `"${expense.category}"`,
                    expense.expenseDate,
                    expense.isDeductible ? 'Sim' : 'Não',
                    `"${expense.description || ''}"`
                  ].join(','))
                ].join('\n')
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `despesas_${new Date().toISOString().split('T')[0]}.csv`
                link.click()
                URL.revokeObjectURL(link.href)
              })
              .catch(error => {
                console.error('Erro ao exportar:', error)
                alert('Erro ao exportar despesas')
              })
          }}
        >
          <FileText className="w-4 h-4" />
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => alert(`Ver detalhes da despesa: ${expense.vendor}`)}
                    >
                      Ver
                    </Button>
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
      </FormModal>
    </div>
  )
}