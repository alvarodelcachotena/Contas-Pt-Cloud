'use client'

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
import { Search, Plus, Download, CreditCard } from "lucide-react"

export default function PaymentsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: '1',
    description: '',
    amount: '',
    method: '1'
  })

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

  // Sample payment data for demonstration
  const payments = [
    {
      id: 1,
      invoiceNumber: 'FAT-2025-002',
      clientName: 'Tecnologias XYZ SA',
      amount: 2706.00,
      paymentDate: '2025-06-20',
      paymentMethod: 'Transferência Bancária',
      status: 'confirmed'
    },
    {
      id: 2,
      invoiceNumber: 'FAT-2025-001',
      clientName: 'Empresa ABC Lda',
      amount: 1845.00,
      paymentDate: '2025-06-18',
      paymentMethod: 'MB Way',
      status: 'pending'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
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
      case 'confirmed':
        return 'Confirmado'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhado'
      default:
        return status
    }
  }

  const handleOpenModal = () => {
    setFormData({
      type: '1',
      description: '',
      amount: '',
      method: '1'
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      type: '1',
      description: '',
      amount: '',
      method: '1'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória')
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      alert('Valor deve ser um número válido')
      return
    }
    if (!['1', '2'].includes(formData.type)) {
      alert('Tipo de pagamento inválido')
      return
    }
    if (!['1', '2', '3', '4'].includes(formData.method)) {
      alert('Método de pagamento inválido')
      return
    }

    setIsSubmitting(true)
    
    try {
      const methodMap = {'1': 'transfer', '2': 'cash', '3': 'card', '4': 'check'}
      
      const newPayment = {
        description: formData.description,
        amount: formData.type === '2' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
        method: methodMap[formData.method as keyof typeof methodMap],
        type: formData.type === '1' ? 'income' : 'expense',
        date: new Date().toISOString(),
        status: 'completed'
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      })

      if (!response.ok) {
        throw new Error('Erro ao registar pagamento')
      }

      alert(`Pagamento registado com sucesso!\n${formData.type === '1' ? 'Recebimento' : 'Pagamento'}: €${Math.abs(Number(formData.amount)).toFixed(2)}`)
      handleCloseModal()
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao registar pagamento')
    } finally {
      setIsSubmitting(false)
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
                <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
                <p className="text-gray-600 mt-1">Gestão de pagamentos e recebimentos</p>
              </div>
              <Button 
                className="flex items-center space-x-2"
                onClick={handleOpenModal}
              >
                <Plus className="w-4 h-4" />
                <span>Registar Pagamento</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Procurar pagamentos..."
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => alert('Funcionalidade de exportação será implementada em breve')}
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Recebimentos do Mês</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">€4.551,00</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">€1.845,00</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Taxa de Recebimento</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">71%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Fatura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum pagamento registado
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                        <TableCell>{payment.clientName}</TableCell>
                        <TableCell className="font-medium">€{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => alert(`Ver detalhes do pagamento:\nFatura: ${payment.invoiceNumber}\nCliente: ${payment.clientName}\nValor: €${payment.amount.toFixed(2)}`)}
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
              Total: {payments.length} pagamento(s) • 
              Valor Total: €{payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
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
        title="Registar Pagamento"
        submitLabel="Registar"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="block mb-1">
              Tipo de Pagamento *
            </Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="1">Recebimento</option>
              <option value="2">Pagamento</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição *
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

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Valor (€) *
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
            <Label htmlFor="method" className="block mb-1">
              Método de Pagamento *
            </Label>
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="1">Transferência</option>
              <option value="2">Dinheiro</option>
              <option value="3">Cartão</option>
              <option value="4">Cheque</option>
            </select>
          </div>

          {/* Preview */}
          {formData.amount && !isNaN(Number(formData.amount)) && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Resumo</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className={formData.type === '1' ? 'text-green-600' : 'text-red-600'}>
                    {formData.type === '1' ? 'Recebimento' : 'Pagamento'}
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