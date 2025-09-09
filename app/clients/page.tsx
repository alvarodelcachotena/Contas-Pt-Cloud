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
import { Search, Plus, Users, Mail, Phone, MapPin, AlertCircle } from 'lucide-react'
import DeleteAllButton from '@/components/delete-all-button'

interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  taxId: string | null
  postalCode: string | null
  city: string | null
  createdAt: string
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    postalCode: '',
    city: ''
  })

  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      return response.json()
    }
  })

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      postalCode: '',
      city: ''
    })
    setError(null) // Limpiar errores anteriores
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      postalCode: '',
      city: ''
    })
    setError(null) // Limpiar errores al cerrar
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar cliente')
      }

      // Cliente creado con éxito
      handleCloseModal()

      // Invalidar y recargar los datos automáticamente
      await queryClient.invalidateQueries({ queryKey: ['/api/clients'] })

    } catch (error) {
      console.error('Erro:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar cliente')
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
                <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
                <p className="text-muted-foreground">Gerir informações dos clientes</p>
              </div>
              <div className="flex items-center space-x-2">
                <DeleteAllButton
                  entityName="cliente"
                  entityNamePlural="clientes"
                  apiEndpoint="/api/clients/delete-all"
                  onSuccess={() => {
                    // Refresh the clients list
                    queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
                  }}
                />
                <Button onClick={handleOpenModal} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Novo Cliente</span>
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Lista de Clientes</span>
                </CardTitle>
                <CardDescription>
                  {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar clientes..."
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
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            NIF
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Localização
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Criado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredClients.map((client) => (
                          <tr key={client.id} className="border-b hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {client.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {client.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <span>{client.email}</span>
                                  </div>
                                )}
                                {client.phone && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <span>{client.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {client.taxId || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {client.city && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span>{client.city}</span>
                                  </div>
                                )}
                                {client.postalCode && (
                                  <div className="text-xs text-muted-foreground">
                                    {client.postalCode}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-muted-foreground">
                                {new Date(client.createdAt).toLocaleDateString('pt-PT')}
                              </div>
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

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCancel={handleCloseModal}
        title="Novo Cliente"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
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

          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="cliente@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+351 xxx xxx xxx"
            />
          </div>

          <div>
            <Label htmlFor="taxId">NIF</Label>
            <Input
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleInputChange}
              placeholder="123456789"
            />
          </div>

          <div>
            <Label htmlFor="address">Morada</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, andar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="1000-000"
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Lisboa"
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  )
}