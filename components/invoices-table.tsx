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
import { Search, Plus, FileText, Eye, AlertCircle, Download } from 'lucide-react'

interface Invoice {
  id: number
  number: string
  clientName: string
  clientEmail: string | null
  clientTaxId: string | null
  issueDate: string
  dueDate: string
  amount: number
  vatAmount: number
  vatRate: number
  totalAmount: number
  status: string
  description: string | null
  paymentTerms: string | null
  createdAt: string
}

interface Client {
  id: number
  name: string
  email: string | null
  taxId: string | null
  createdAt: string
}

export default function InvoicesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientFound, setClientFound] = useState<{ name: string; taxId: string } | null>(null)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientTaxId: '',
    amount: '',
    vatRate: '23',
    description: ''
  })

  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch invoices')
      return response.json()
    }
  })

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch clients')
      return response.json()
    }
  })

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const autoCompleteClientNIF = (fieldName: string, value: string) => {
    if (!clients || !value.trim() || value.length < 2) return

    // Buscar cliente por nombre o email (búsqueda más inteligente)
    const foundClient = clients.find(client => {
      if (fieldName === 'clientName') {
        // Buscar por nombre completo o parcial
        return client.name.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(client.name.toLowerCase())
      } else if (fieldName === 'clientEmail') {
        // Buscar por email completo o parcial
        return client.email && (
          client.email.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(client.email.toLowerCase())
        )
      }
      return false
    })

    // Si se encuentra un cliente, auto-completar sus datos
    if (foundClient) {
      setFormData(prev => ({
        ...prev,
        clientName: foundClient.name,
        clientEmail: foundClient.email || '',
        clientTaxId: foundClient.taxId || ''
      }))

      // Mostrar información del cliente encontrado
      setClientFound({
        name: foundClient.name,
        taxId: foundClient.taxId || ''
      })

      // Mostrar mensaje de confirmación
      console.log(`✅ Cliente encontrado: ${foundClient.name} (NIF: ${foundClient.taxId})`)
    } else {
      // Limpiar estado si no se encuentra cliente
      setClientFound(null)
    }
  }

  const handleOpenModal = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientTaxId: '',
      amount: '',
      vatRate: '23',
      description: ''
    })
    setError(null) // Limpiar errores anteriores
    setClientFound(null) // Limpiar cliente encontrado
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      clientName: '',
      clientEmail: '',
      clientTaxId: '',
      amount: '',
      vatRate: '23',
      description: ''
    })
    setError(null) // Limpiar errores al cerrar
    setClientFound(null) // Limpiar cliente encontrado
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null)

    // Auto-completar NIF cuando se escribe nombre o email del cliente
    if (name === 'clientName' || name === 'clientEmail') {
      autoCompleteClientNIF(name, value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation without alerts
    if (!formData.clientName.trim()) {
      setError('Nome do cliente é obrigatório')
      return
    }
    if (!formData.clientTaxId.trim()) {
      setError('NIF do cliente é obrigatório')
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      setError('Valor deve ser um número válido')
      return
    }
    if (!['6', '13', '23'].includes(formData.vatRate)) {
      setError('Taxa de IVA inválida. Use 6, 13 ou 23')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate VAT and total
      const baseAmount = Number(formData.amount)
      const vatAmount = baseAmount * (Number(formData.vatRate) / 100)
      const totalAmount = baseAmount + vatAmount

      const newInvoice = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || null,
        clientTaxId: formData.clientTaxId,
        amount: baseAmount,
        vatAmount,
        vatRate: Number(formData.vatRate),
        totalAmount,
        description: formData.description || null,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: 'pending'
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar fatura')
      }

      // Fatura criada com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/invoices'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar fatura')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        setError('Não há faturas para exportar')
        return
      }

      // Prepare CSV data
      const csvContent = [
        ['Número', 'Cliente', 'NIF', 'Valor Base', 'IVA', 'Total', 'Data Emissão', 'Vencimento', 'Estado', 'Descrição'].join(','),
        ...invoices.map((invoice) => [
          `"${invoice.number}"`,
          `"${invoice.clientName}"`,
          `"${invoice.clientTaxId || ''}"`,
          invoice.amount.toFixed(2),
          invoice.vatAmount.toFixed(2),
          invoice.totalAmount.toFixed(2),
          invoice.issueDate,
          invoice.dueDate,
          `"${invoice.status}"`,
          `"${invoice.description || ''}"`
        ].join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `faturas_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      console.log('✅ Faturas exportadas com sucesso')
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError('Erro ao exportar faturas')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default'
      case 'sent':
        return 'secondary'
      case 'draft':
        return 'outline'
      case 'overdue':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Pago'
      case 'sent':
        return 'Enviado'
      case 'draft':
        return 'Rascunho'
      case 'overdue':
        return 'Vencido'
      default:
        return status
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
          <h1 className="text-3xl font-bold text-foreground">Faturas</h1>
          <p className="text-muted-foreground mt-1">Gestão e emissão de faturas</p>
        </div>
        <Button
          className="flex items-center space-x-2"
          onClick={handleOpenModal}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Fatura</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Procurar faturas..."
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
          <FileText className="w-4 h-4" />
          <span>Exportar</span>
        </Button>
      </div>

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

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Fatura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Nenhuma fatura encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.clientName}</TableCell>
                  <TableCell>{invoice.clientTaxId || '-'}</TableCell>
                  <TableCell>€{parseFloat(invoice.amount.toString()).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    €{parseFloat(invoice.totalAmount.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.issueDate).toLocaleDateString('pt-PT')}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString('pt-PT')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log(`Ver detalhes da fatura ${invoice.number}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log(`Gerar PDF da fatura ${invoice.number}`)}
                      >
                        PDF
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
        Total: {filteredInvoices.length} fatura(s) •
        Valor Total: €{filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0).toFixed(2)}
      </div>

      {/* Modal de Nova Fatura */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        title="Nova Fatura"
        submitLabel="Criar Fatura"
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="space-y-4">
          {/* Mensaje de error general */}
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
              <Label htmlFor="clientName" className="block mb-1">
                Nome do Cliente *
              </Label>
              <Input
                id="clientName"
                name="clientName"
                type="text"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="Nome do cliente ou empresa"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite o nome para auto-completar os dados
              </p>
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email do Cliente
              </label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={handleInputChange}
                placeholder="email@exemplo.pt"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Digite o email para auto-completar os dados
              </p>
            </div>
          </div>

          {/* Indicador de cliente encontrado */}
          {clientFound && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-sm text-green-800">
                  <span className="font-medium">Cliente encontrado:</span> {clientFound.name}
                  <span className="ml-2 text-green-600">(NIF: {clientFound.taxId})</span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientTaxId" className="block mb-1">
                NIF do Cliente *
              </Label>
              <Input
                id="clientTaxId"
                name="clientTaxId"
                type="text"
                value={formData.clientTaxId}
                onChange={handleInputChange}
                placeholder="9 dígitos"
                maxLength={9}
                pattern="[0-9]{9}"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount" className="block mb-1">
                Valor Base (€) *
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

          <div>
            <Label htmlFor="vatRate" className="block mb-1">
              Taxa de IVA (%) *
            </Label>
            <select
              id="vatRate"
              name="vatRate"
              value={formData.vatRate}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="6">6%</option>
              <option value="13">13%</option>
              <option value="23">23%</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Fatura
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descrição dos serviços ou produtos"
            />
          </div>

          {/* Preview do Cálculo */}
          {formData.amount && !isNaN(Number(formData.amount)) && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Resumo da Fatura</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Valor Base:</span>
                  <span>€{Number(formData.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({formData.vatRate}%):</span>
                  <span>€{(Number(formData.amount) * (Number(formData.vatRate) / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground border-t pt-1">
                  <span>Total:</span>
                  <span>€{(Number(formData.amount) * (1 + Number(formData.vatRate) / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  )
}