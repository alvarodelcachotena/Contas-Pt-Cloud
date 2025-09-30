'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
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
import { Search, Plus, FileText, Eye, AlertCircle, Download, Trash2 } from 'lucide-react'
import DeleteAllButton from './delete-all-button'

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
  paymentType: string
  supplierId: number | null
  createdAt: string
}

interface Client {
  id: number
  name: string
  email: string | null
  taxId: string | null
  createdAt: string
}

interface Supplier {
  id: number
  name: string
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  contact_person: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function InvoicesTable() {
  const { t } = useLanguage()
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
    description: '',
    paymentType: 'bank_transfer',
    supplierId: ''
  })

  const queryClient = useQueryClient()

  const { data: invoices, isLoading, refetch: refetchInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      console.log('🔍 Fetching invoices from frontend...')
      const response = await fetch('/api/invoices', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const data = await response.json()
      console.log('📄 Invoices fetched:', data?.length || 0, 'invoices')
      console.log('📄 First invoice:', data?.[0])
      return data
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

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers', {
        headers: {
          'x-tenant-id': '1'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch suppliers')
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
      description: '',
      paymentType: 'bank_transfer',
      supplierId: ''
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
      description: '',
      paymentType: 'bank_transfer',
      supplierId: ''
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
      setError(t.invoices.errors.clientNameRequired)
      return
    }
    if (!formData.clientTaxId.trim()) {
      setError(t.invoices.errors.taxIdRequired)
      return
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      setError(t.invoices.errors.amountRequired)
      return
    }
    if (!['6', '13', '23'].includes(formData.vatRate)) {
      setError(t.invoices.errors.vatRateInvalid)
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
        status: 'pending',
        paymentType: formData.paymentType,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t.invoices.errors.createError)
      }

      // Fatura criada com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/invoices'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : t.invoices.errors.createError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!invoices || invoices.length === 0) {
        setError(t.invoices.errors.exportError)
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
    }
  }

  const handleDeleteInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      console.log(`🗑️ Attempting to delete invoice ${invoiceId} (${invoiceNumber})`)

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log(`📡 Delete response status: ${response.status}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Invoice deleted successfully:`, result)
        await refetchInvoices()
        console.log(`🔄 Invoice list refreshed`)
      } else {
        const errorText = await response.text()
        console.error(`❌ Delete failed: ${response.status} - ${errorText}`)
        setError(`Error al eliminar factura: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error deleting invoice:', error)
      setError(`Error al eliminar factura: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
        return t.invoices.status.paid
      case 'sent':
        return t.invoices.status.sent
      case 'draft':
        return t.invoices.status.draft
      case 'overdue':
        return t.invoices.status.overdue
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
          <h1 className="text-3xl font-bold text-foreground">{t.invoices.title}</h1>
          <p className="text-muted-foreground mt-1">{t.invoices.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <DeleteAllButton
            entityName="fatura"
            entityNamePlural="faturas"
            apiEndpoint="/api/invoices/delete-all"
            onSuccess={() => {
              // Refresh the invoices list
              queryClient.invalidateQueries({ queryKey: ['/api/invoices'] })
            }}
          />
          <Button
            className="flex items-center space-x-2"
            onClick={handleOpenModal}
          >
            <Plus className="w-4 h-4" />
            <span>{t.invoices.newInvoice}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t.invoices.searchPlaceholder}
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
          <span>{t.invoices.export}</span>
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
              <TableHead>{t.invoices.table.fileName}</TableHead>
              <TableHead>{t.invoices.table.nif}</TableHead>
              <TableHead>{t.invoices.table.vat}</TableHead>
              <TableHead>{t.invoices.table.total}</TableHead>
              <TableHead>{t.invoices.table.paymentType}</TableHead>
              <TableHead>{t.invoices.table.issueDate}</TableHead>
              <TableHead>{t.invoices.table.status}</TableHead>
              <TableHead>{t.invoices.table.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  {t.invoices.noInvoices}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{invoice.clientTaxId || '-'}</TableCell>
                  <TableCell>€{parseFloat(invoice.vatAmount.toString()).toFixed(2)} ({invoice.vatRate}%)</TableCell>
                  <TableCell className="font-medium">
                    €{parseFloat((parseFloat(invoice.amount.toString()) + parseFloat((invoice.vatAmount || 0).toString())).toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      invoice.paymentType === 'bank_transfer' ? 'default' :
                        invoice.paymentType === 'card' ? 'secondary' : 'outline'
                    }>
                      {invoice.paymentType === 'bank_transfer' ? t.invoices.paymentTypes.bankTransfer :
                        invoice.paymentType === 'card' ? t.invoices.paymentTypes.card : t.invoices.paymentTypes.supplierCredit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.issueDate).toLocaleDateString('pt-PT')}
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
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.number)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
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
        {t.invoices.totalInvoices}: {filteredInvoices.length} fatura(s) •
        {t.invoices.totalValue}: €{filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0).toFixed(2)}
      </div>

      {/* Modal de Nova Fatura */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onCancel={handleCloseModal}
        title={t.invoices.modal.title}
        submitLabel={t.invoices.modal.submitLabel}
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
                {t.invoices.modal.clientName} *
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
                {t.invoices.modal.autoCompleteHint}
              </p>
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                {t.invoices.modal.clientEmail}
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
                {t.invoices.modal.autoCompleteHint}
              </p>
            </div>
          </div>

          {/* Indicador de cliente encontrado */}
          {clientFound && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-sm text-green-800">
                  <span className="font-medium">{t.invoices.modal.clientFound}:</span> {clientFound.name}
                  <span className="ml-2 text-green-600">(NIF: {clientFound.taxId})</span>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientTaxId" className="block mb-1">
                {t.invoices.modal.clientTaxId} *
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
                {t.invoices.modal.baseAmount} *
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
              {t.invoices.modal.vatRate} *
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
              {t.invoices.modal.description}
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

          {/* Payment Type and Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentType" className="block mb-1">
                {t.invoices.modal.paymentType} *
              </Label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="bank_transfer">{t.invoices.paymentTypes.bankTransfer}</option>
                <option value="card">{t.invoices.paymentTypes.card}</option>
                <option value="supplier_credit">{t.invoices.paymentTypes.supplierCredit}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="supplierId" className="block mb-1">
                {t.invoices.modal.supplier}
              </Label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecionar fornecedor (opcional)</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.tax_id && `(${supplier.tax_id})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview do Cálculo */}
          {formData.amount && !isNaN(Number(formData.amount)) && (
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{t.invoices.modal.summary}</h4>
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