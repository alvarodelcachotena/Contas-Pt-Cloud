'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Building, Shield, Settings } from 'lucide-react'

export default function UserSettingsPage() {
  const { user, tenant } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      alert('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erro ao atualizar perfil')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      postalCode: ''
    })
    setIsEditing(false)
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
                <h1 className="text-2xl font-bold text-foreground">Definições do Utilizador</h1>
                <p className="text-muted-foreground">Gerir perfil e definições da conta</p>
              </div>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      Guardar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Editar Perfil</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Informações Pessoais</span>
                  </CardTitle>
                  <CardDescription>
                    Gerir informações do seu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Seu nome completo"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                          <span className="text-foreground">{user?.name || 'Não definido'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="seu@email.com"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{user?.email || 'Não definido'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+351 xxx xxx xxx"
                        />
                                             ) : (
                         <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                           <Phone className="w-4 h-4 text-muted-foreground" />
                           <span className="text-foreground">Não definido</span>
                         </div>
                       )}
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Morada</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Rua, número, andar"
                        />
                                             ) : (
                         <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                           <MapPin className="w-4 h-4 text-muted-foreground" />
                           <span className="text-foreground">Não definido</span>
                         </div>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Código Postal</Label>
                        {isEditing ? (
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            placeholder="1000-000"
                          />
                                                 ) : (
                           <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                             <span className="text-foreground">Não definido</span>
                           </div>
                         )}
                      </div>
                      
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Lisboa"
                          />
                                                 ) : (
                           <div className="flex items-center space-x-2 p-2 rounded-md bg-muted">
                             <span className="text-foreground">Não definido</span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Empresa Atual</span>
                  </CardTitle>
                  <CardDescription>
                    Informações da empresa associada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 rounded-md bg-muted">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {tenant?.name || 'Nenhuma empresa'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tenant?.nif ? `NIF: ${tenant.nif}` : 'NIF não disponível'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-md bg-muted">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Função: {user?.role || 'Não definida'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Nível de acesso na empresa
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-md bg-muted">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          Estado: <Badge variant="default" className="ml-2">Ativo</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Conta ativa no sistema
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}