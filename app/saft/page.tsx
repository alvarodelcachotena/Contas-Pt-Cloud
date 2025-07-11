'use client'

import { useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Download, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"

export default function SAFTPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025')

  const saftReports = [
    {
      id: 1,
      period: '2025',
      type: 'SAF-T (PT)',
      status: 'completed',
      generatedDate: '2025-06-20T14:30:00',
      fileSize: '2.5 MB',
      records: 1247
    },
    {
      id: 2,
      period: '2024',
      type: 'SAF-T (PT)',
      status: 'completed',
      generatedDate: '2025-01-15T10:20:00',
      fileSize: '8.9 MB',
      records: 4568
    },
    {
      id: 3,
      period: '2023',
      type: 'SAF-T (PT)',
      status: 'completed',
      generatedDate: '2024-01-20T16:45:00',
      fileSize: '12.1 MB',
      records: 6789
    }
  ]

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'info'
      case 'pending': return 'warning'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Processando'
      case 'pending': return 'Pendente'
      case 'error': return 'Erro'
      default: return 'Desconhecido'
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
                <h1 className="text-3xl font-bold text-foreground">SAF-T</h1>
                <p className="text-muted-foreground mt-1">Standard Audit File for Tax - Ficheiro normalizado de auditoria fiscal</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
                <Button className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Gerar SAFT</span>
                </Button>
              </div>
            </div>

            {/* SAF-T Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Relatórios Gerados</h3>
                      <p className="text-3xl font-bold text-foreground mt-2">{saftReports.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Registos Totais</h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {saftReports.reduce((sum, report) => sum + report.records, 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Último Relatório</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">2025</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estado Atual</h3>
                      <div className="mt-2">
                                              <Badge variant="success">
                        Atualizado
                      </Badge>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Sobre SAF-T (PT)</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    O SAF-T (PT) é um ficheiro normalizado de auditoria fiscal exigido pela Autoridade Tributária portuguesa. 
                    Contém toda a informação contabilística e fiscal da empresa num formato XML estruturado, 
                    facilitando as auditorias e verificações fiscais.
                  </p>
                  <div className="mt-3 text-blue-700 text-sm">
                    <strong>Periodicidade:</strong> Anual • <strong>Formato:</strong> XML • <strong>Codificação:</strong> UTF-8
                  </div>
                </div>
              </div>
            </div>

            {/* SAF-T Reports List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relatórios SAF-T</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-600">Período</th>
                      <th className="text-left p-4 font-medium text-gray-600">Tipo</th>
                      <th className="text-left p-4 font-medium text-gray-600">Data Geração</th>
                      <th className="text-left p-4 font-medium text-gray-600">Registos</th>
                      <th className="text-left p-4 font-medium text-gray-600">Tamanho</th>
                      <th className="text-left p-4 font-medium text-gray-600">Estado</th>
                      <th className="text-right p-4 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saftReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{report.period}</td>
                        <td className="p-4">{report.type}</td>
                        <td className="p-4">
                          {new Date(report.generatedDate).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="p-4">{report.records.toLocaleString()}</td>
                        <td className="p-4">{report.fileSize}</td>
                        <td className="p-4">
                          <Badge variant={getStatusVariant(report.status)}>
                            {getStatusText(report.status)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </CardContent>
            </Card>

            {/* Requirements Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requisitos SAF-T</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Dados de identificação da empresa</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Tabela de contas (Plano Oficial de Contabilidade)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Clientes e fornecedores</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Produtos e serviços</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Documentos de venda (faturas, recibos)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Documentos de compra</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Movimentos contabilísticos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Validação XML (Schema XSD)</span>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}