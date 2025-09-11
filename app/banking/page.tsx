'use client'

import { useAuth } from "@/hooks/useAuth"
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
import { Search, Plus, Download, CreditCard, AlertCircle, Eye, TrendingUp, TrendingDown } from "lucide-react"
import { useLanguage } from '@/hooks/useLanguage'

interface BankingTransaction {
  id: number
  accountNumber: string
  transactionType: 'credit' | 'debit' | 'transfer'
  amount: number
  description: string
  transactionDate: string
  balance: number
  category: string
  reference: string
  createdAt: string
}

export default function BankingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    accountNumber: '',
    transactionType: 'credit',
    amount: '',
    description: '',
    category: '',
    reference: ''
  })

  const queryClient = useQueryClient()

  // Fetch banking transactions from API
  const { data: transactions, isLoading: transactionsLoading, error: queryError } = useQuery<BankingTransaction[]>({
    queryKey: ['/api/banking'],
    queryFn: async () => {
      const response = await fetch('/api/banking', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch banking transactions')
      return response.json()
    }
  })

  // Filter transactions based on search term
  const filteredTransactions = transactions?.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Calculate metrics
  const totalCredits = transactions?.filter(t => t.transactionType === 'credit').reduce((sum, t) => sum + t.amount, 0) || 0
  const totalDebits = transactions?.filter(t => t.transactionType === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
  const currentBalance = transactions && transactions.length > 0 ? transactions[0].balance : 0
  const transactionCount = transactions?.length || 0

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
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600'
      case 'debit':
        return 'text-red-600'
      case 'transfer':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'credit':
        return t.banking.transactionTypes.credit
      case 'debit':
        return t.banking.transactionTypes.debit
      case 'transfer':
        return t.banking.transactionTypes.transfer
      default:
        return type
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'debit':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'transfer':
        return <CreditCard className="w-4 h-4 text-blue-600" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const handleOpenModal = () => {
    setFormData({
      accountNumber: 'PT50000123456789012345',
      transactionType: 'credit',
      amount: '',
      description: '',
      category: '',
      reference: ''
    })
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      accountNumber: 'PT50000123456789012345',
      transactionType: 'credit',
      amount: '',
      description: '',
      category: '',
      reference: ''
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
      setError(t.banking.validation.descriptionRequired)
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      setError(t.banking.validation.amountValid)
      return
    }
    if (!formData.category.trim()) {
      setError(t.banking.validation.categoryRequired)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const newTransaction = {
        accountNumber: formData.accountNumber,
        transactionType: formData.transactionType,
        amount: formData.transactionType === 'debit' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
        description: formData.description,
        transactionDate: new Date().toISOString().split('T')[0],
        balance: currentBalance + (formData.transactionType === 'credit' ? Number(formData.amount) : -Number(formData.amount)),
        category: formData.category,
        reference: formData.reference || null
      }

      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t.banking.validation.createError)
      }

      // Transação criada com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/banking'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : t.banking.validation.createError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!transactions || transactions.length === 0) {
        setError(t.banking.validation.noTransactionsToExport)
        return
      }

      // Generate CSV content
      const csvContent = [
        ['ID', 'Conta', 'Tipo', 'Valor', 'Descrição', 'Data', 'Saldo', 'Categoria', 'Referência'].join(','),
        ...transactions.map((transaction) => [
          transaction.id,
          `"${transaction.accountNumber}"`,
          transaction.transactionType,
          transaction.amount,
          `"${transaction.description}"`,
          transaction.transactionDate,
          transaction.balance,
          `"${transaction.category}"`,
          `"${transaction.reference || ''}"`
        ].join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `transacoes_bancarias_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      console.log('✅ Transações bancárias exportadas com sucesso')
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError(t.banking.validation.exportError)
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
                <h1 className="text-3xl font-bold text-foreground">{t.banking.title}</h1>
                <p className="text-gray-600 mt-1">{t.banking.subtitle}</p>
              </div>
              <Button
                className="flex items-center space-x-2"
                onClick={handleOpenModal}
              >
                <Plus className="w-4 h-4" />
                <span>{t.banking.newTransaction}</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t.banking.searchPlaceholder}
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
                <span>{t.banking.export}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.banking.metrics.currentBalance}</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">€{currentBalance.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.banking.metrics.totalCredits}</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">€{totalCredits.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.banking.metrics.totalDebits}</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">€{totalDebits.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.banking.metrics.transactions}</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{transactionCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {transactionsLoading ? (
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
                      <TableHead>{t.banking.table.type}</TableHead>
                      <TableHead>{t.banking.table.description}</TableHead>
                      <TableHead>{t.banking.table.amount}</TableHead>
                      <TableHead>{t.banking.table.date}</TableHead>
                      <TableHead>{t.banking.table.balance}</TableHead>
                      <TableHead>{t.banking.table.category}</TableHead>
                      <TableHead>{t.banking.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t.banking.noTransactionsFound}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTransactionTypeIcon(transaction.transactionType)}
                              <Badge variant={transaction.transactionType === 'credit' ? 'default' : 'secondary'}>
                                {getTransactionTypeLabel(transaction.transactionType)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell className={`font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                            {transaction.transactionType === 'debit' ? '-' : '+'}€{Math.abs(transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.transactionDate).toLocaleDateString('pt-PT')}
                          </TableCell>
                          <TableCell className="font-medium">€{transaction.balance.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => console.log(`Ver detalhes da transação: ${transaction.description}`)}
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
              {t.banking.totalTransactions}: {filteredTransactions.length} transação(ões) •
              {t.banking.finalBalance}: €{filteredTransactions.length > 0 ? filteredTransactions[filteredTransactions.length - 1].balance.toFixed(2) : '0.00'}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Nova Transação Bancária */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        title={t.banking.newTransaction}
        submitLabel="Criar Transação"
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
              <Label htmlFor="transactionType" className="block mb-1">
                {t.banking.form.transactionTypeRequired}
              </Label>
              <select
                id="transactionType"
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="credit">{t.banking.transactionTypes.credit} (Entrada)</option>
                <option value="debit">{t.banking.transactionTypes.debit} (Saída)</option>
                <option value="transfer">{t.banking.transactionTypes.transfer}</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                {t.banking.form.amountRequired}
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder={t.banking.form.amountPlaceholder}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              {t.banking.form.descriptionRequired}
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t.banking.form.descriptionPlaceholder}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                {t.banking.form.categoryRequired}
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleInputChange}
                placeholder={t.banking.form.categoryPlaceholder}
                required
              />
            </div>

            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                {t.banking.form.reference}
              </label>
              <Input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleInputChange}
                placeholder={t.banking.form.referencePlaceholder}
              />
            </div>
          </div>

          {/* Preview */}
          {formData.amount && !isNaN(Number(formData.amount)) && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.banking.form.summary}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t.banking.form.type}:</span>
                  <span className={formData.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {getTransactionTypeLabel(formData.transactionType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t.banking.form.value}:</span>
                  <span className={`font-medium ${formData.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.transactionType === 'credit' ? '+' : '-'}€{Number(formData.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t.banking.form.newBalance}:</span>
                  <span className="font-medium text-blue-600">
                    €{(currentBalance + (formData.transactionType === 'credit' ? Number(formData.amount) : -Number(formData.amount))).toFixed(2)}
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