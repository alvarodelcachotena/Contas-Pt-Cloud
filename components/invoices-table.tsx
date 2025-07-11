'use client'

import { useQuery } from '@tanstack/react-query'
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
import { Search, Plus, FileText, Eye } from 'lucide-react'

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

export default function InvoicesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientTaxId: '',
    amount: '',
    vatRate: '23',
    description: ''
  })

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices')
      if (!response.ok) throw new Error('Failed to fetch invoices')
      return response.json()
    }
  })

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleOpenModal = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientTaxId: '',
      amount: '',
      vatRate: '23',
      description: ''
    })
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
    if (!formData.clientName.trim()) {
      alert('Nome do cliente é obrigatório')
      return
    }
    if (!formData.clientTaxId.trim()) {
      alert('NIF do cliente é obrigatório')
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      alert('Valor deve ser um número válido')
      return
    }
    if (!['6', '13', '23'].includes(formData.vatRate)) {
      alert('Taxa de IVA inválida. Use 6, 13 ou 23')
      return
    }

    setIsSubmitting(true)
    
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
        throw new Error('Erro ao criar fatura')
      }

      alert(`Fatura criada com sucesso!\nValor: €${baseAmount.toFixed(2)}\nIVA (${formData.vatRate}%): €${vatAmount.toFixed(2)}\nTotal: €${totalAmount.toFixed(2)}`)
      handleCloseModal()
      window.location.reload()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar fatura')
    } finally {
      setIsSubmitting(false)
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
          onClick={() => {
            // Fetch invoices and export as CSV
            fetch('/api/invoices')
              .then(response => response.json())
              .then(data => {
                const csvContent = [
                  ['Número', 'Cliente', 'NIF', 'Valor Base', 'IVA', 'Total', 'Data Emissão', 'Vencimento', 'Estado'].join(','),
                  ...data.map((invoice: any) => [
                    `"${invoice.number}"`,
                    `"${invoice.clientName}"`,
                    invoice.clientTaxId,
                    invoice.amount,
                    invoice.vatAmount,
                    invoice.totalAmount,
                    invoice.issueDate,
                    invoice.dueDate,
                    `"${invoice.status}"`
                  ].join(','))
                ].join('\n')
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `faturas_${new Date().toISOString().split('T')[0]}.csv`
                link.click()
                URL.revokeObjectURL(link.href)
              })
              .catch(error => {
                console.error('Erro ao exportar:', error)
                alert('Erro ao exportar faturas')
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
                        onClick={() => alert(`Ver detalhes da fatura ${invoice.number}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => alert(`Gerar PDF da fatura ${invoice.number}`)}
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
            </div>
          </div>

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