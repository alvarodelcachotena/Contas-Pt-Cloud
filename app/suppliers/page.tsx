'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormModal } from '@/components/ui/modal'
import { Search, Plus, Building2, Mail, Phone, MapPin, AlertCircle, Trash2, Edit } from 'lucide-react'
import DeleteAllButton from '@/components/delete-all-button'

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

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    contact_person: '',
    payment_terms: '',
    notes: ''
  })

  const queryClient = useQueryClient()

  // Fetch suppliers from API
  const { data: suppliers, isLoading, error: queryError } = useQuery<Supplier[]>({
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

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers?.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        tax_id: supplier.tax_id || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        postal_code: supplier.postal_code || '',
        city: supplier.city || '',
        contact_person: supplier.contact_person || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || ''
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        city: '',
        contact_person: '',
        payment_terms: '',
        notes: ''
      })
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      tax_id: '',
      email: '',
      phone: '',
      address: '',
      postal_code: '',
      city: '',
      contact_person: '',
      payment_terms: '',
      notes: ''
    })
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Validation
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const url = editingSupplier ? '/api/suppliers' : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'
      
      const requestBody = editingSupplier 
        ? { id: editingSupplier.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar fornecedor')
      }

      // Fornecedor salvo com sucesso
      handleCloseModal()

      // Invalidar e recarregar os dados automaticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : 'Erro ao salvar fornecedor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm('Tem certeza de que deseja eliminar este fornecedor?')) {
      return
    }

    try {
      const response = await fetch(`/api/suppliers?id=${supplierId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao eliminar fornecedor')
      }

      // Fornecedor eliminado com sucesso
      await queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : 'Erro ao eliminar fornecedor')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-4">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Error display */}
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

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
                <p className="text-muted-foreground">Gerir informações dos fornecedores</p>
              </div>
              <div className="flex items-center space-x-2">
                <DeleteAllButton
                  entityName="fornecedor"
                  entityNamePlural="fornecedores"
                  apiEndpoint="/api/suppliers/delete-all"
                  onSuccess={() => {
                    // Refresh the suppliers list
                    queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] })
                  }}
                />
                <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Novo Fornecedor</span>
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Lista de Fornecedores</span>
                </CardTitle>
                <CardDescription>
                  {filteredSuppliers.length} fornecedor{filteredSuppliers.length !== 1 ? 'es' : ''} encontrado{filteredSuppliers.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar fornecedores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSuppliers.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{supplier.name}</h3>
                            {supplier.tax_id && (
                              <p className="text-sm text-muted-foreground">NIF: {supplier.tax_id}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(supplier)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {supplier.email && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {(supplier.address || supplier.city) && (
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <span>
                                {supplier.address && `${supplier.address}`}
                                {supplier.address && supplier.city && ', '}
                                {supplier.city}
                                {supplier.postal_code && ` ${supplier.postal_code}`}
                              </span>
                            </div>
                          )}
                          {supplier.contact_person && (
                            <div className="text-sm text-muted-foreground">
                              Contacto: {supplier.contact_person}
                            </div>
                          )}
                          {supplier.payment_terms && (
                            <div className="text-sm text-muted-foreground">
                              Termos: {supplier.payment_terms}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredSuppliers.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor registado'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? 'Tente ajustar os termos de pesquisa' 
                        : 'Comece por adicionar o seu primeiro fornecedor'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => handleOpenModal()} className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Fornecedor</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal para criar/editar fornecedor */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCancel={handleCloseModal}
        title={editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        size="lg"
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
              <Label htmlFor="name" className="block mb-1">
                Nome da Empresa *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div>
              <Label htmlFor="tax_id" className="block mb-1">
                NIF
              </Label>
              <Input
                id="tax_id"
                name="tax_id"
                type="text"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="Número de identificação fiscal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="block mb-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block mb-1">
                Telefone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+351 123 456 789"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="block mb-1">
              Morada
            </Label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, andar"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code" className="block mb-1">
                Código Postal
              </Label>
              <Input
                id="postal_code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="1234-567"
              />
            </div>

            <div>
              <Label htmlFor="city" className="block mb-1">
                Cidade
              </Label>
              <Input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Lisboa"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_person" className="block mb-1">
                Pessoa de Contacto
              </Label>
              <Input
                id="contact_person"
                name="contact_person"
                type="text"
                value={formData.contact_person}
                onChange={handleInputChange}
                placeholder="Nome da pessoa de contacto"
              />
            </div>

            <div>
              <Label htmlFor="payment_terms" className="block mb-1">
                Termos de Pagamento
              </Label>
              <Input
                id="payment_terms"
                name="payment_terms"
                type="text"
                value={formData.payment_terms}
                onChange={handleInputChange}
                placeholder="Ex: 30 dias"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-1">
              Notas
            </Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Notas adicionais sobre o fornecedor"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </FormModal>
    </div>
  )
}
