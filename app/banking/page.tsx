'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Building2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface BankTransaction {
  id: number
  date: string
  description: string
  amount: number
  balance: number
  type: 'credit' | 'debit'
  category: string
  createdAt: string
}

export default function BankingPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: transactions, isLoading } = useQuery<BankTransaction[]>({
    queryKey: ['/api/banking'],
    queryFn: async () => {
      const response = await fetch('/api/banking')
      if (!response.ok) throw new Error('Failed to fetch transactions')
      return response.json()
    }
  })

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const totalBalance = transactions?.reduce((sum, t) => sum + t.balance, 0) || 0
  const totalIncome = transactions?.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0) || 0
  const totalExpenses = transactions?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Banca</h1>
                <p className="text-muted-foreground">Gerir transações bancárias</p>
              </div>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Importar Transações</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Saldo Total
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{totalBalance.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% desde o último mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Receitas
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€{totalIncome.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +180.1% desde o último mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Despesas
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">€{totalExpenses.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    +19% desde o último mês
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Transações Bancárias</span>
                </CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar transações..."
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
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Categoria
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Valor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Saldo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {new Date(transaction.date).toLocaleDateString('pt-PT')}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-foreground">
                                {transaction.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary">
                                {transaction.category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'credit' ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-foreground">
                                €{transaction.balance.toFixed(2)}
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
    </div>
  )
}