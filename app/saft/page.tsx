'use client'

import { useLanguage } from '@/hooks/useLanguage';
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
import { formatDate, formatNumber } from "@/lib/formatters"

export default function SAFTPage() {
  const { t } = useLanguage();
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
      case 'completed': return t.saft.status.completed
      case 'processing': return t.saft.status.processing
      case 'pending': return t.saft.status.pending
      case 'error': return t.saft.status.error
      default: return t.saft.status.unknown
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
                <h1 className="text-3xl font-bold text-foreground">{t.saft.title}</h1>
                <p className="text-muted-foreground mt-1">{t.saft.subtitle}</p>
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
                  <span>{t.saft.generateSaft}</span>
                </Button>
              </div>
            </div>

            {/* SAF-T Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">{t.saft.metrics.reportsGenerated}</h3>
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
                      <h3 className="text-sm font-medium text-muted-foreground">{t.saft.metrics.totalRecords}</h3>
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
                      <h3 className="text-sm font-medium text-muted-foreground">{t.saft.metrics.lastReport}</h3>
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
                      <h3 className="text-sm font-medium text-muted-foreground">{t.saft.metrics.currentStatus}</h3>
                      <div className="mt-2">
                        <Badge variant="success">
                          {t.saft.status.updated}
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
                  <h3 className="font-medium text-blue-900 mb-2">{t.saft.about.title}</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {t.saft.about.description}
                  </p>
                  <div className="mt-3 text-blue-700 text-sm">
                    <strong>{t.saft.about.periodicity}:</strong> {t.saft.about.annual} • <strong>{t.saft.about.format}:</strong> {t.saft.about.xml} • <strong>{t.saft.about.encoding}:</strong> {t.saft.about.utf8}
                  </div>
                </div>
              </div>
            </div>

            {/* SAF-T Reports List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.saft.reports.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.period}</th>
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.type}</th>
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.generationDate}</th>
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.records}</th>
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.size}</th>
                        <th className="text-left p-4 font-medium text-gray-600">{t.saft.reports.status}</th>
                        <th className="text-right p-4 font-medium text-gray-600">{t.saft.reports.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saftReports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{report.period}</td>
                          <td className="p-4">{report.type}</td>
                          <td className="p-4">
                            {formatDate(report.generatedDate)}
                          </td>
                          <td className="p-4">{formatNumber(report.records)}</td>
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
                <CardTitle className="text-lg">{t.saft.requirements.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.companyData}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.chartOfAccounts}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.clientsSuppliers}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.productsServices}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.salesDocuments}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.purchaseDocuments}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.accountingMovements}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm">{t.saft.requirements.xmlValidation}</span>
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