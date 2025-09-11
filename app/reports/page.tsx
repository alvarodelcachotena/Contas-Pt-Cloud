'use client'

import { useLanguage } from '@/hooks/useLanguage';
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  TrendingUp,
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Search,
  Euro,
  Users,
  Receipt,
  Building2
} from "lucide-react"

export default function ReportsPage() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all')
  const [dateRange, setDateRange] = useState('month')

  const reportTypes = [
    {
      id: 'financial',
      name: t.reports.types.financial,
      description: t.reports.types.financialDesc,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      data: { revenue: '€45,230', expenses: '€23,150', profit: '€22,080' }
    },
    {
      id: 'invoices',
      name: t.reports.types.invoices,
      description: t.reports.types.invoicesDesc,
      icon: FileText,
      color: 'bg-green-100 text-green-600',
      data: { issued: 124, paid: 98, pending: 26 }
    },
    {
      id: 'expenses',
      name: t.reports.types.expenses,
      description: t.reports.types.expensesDesc,
      icon: Receipt,
      color: 'bg-red-100 text-red-600',
      data: { total: '€23,150', categories: 8, deductible: '€18,420' }
    },
    {
      id: 'clients',
      name: t.reports.types.clients,
      description: t.reports.types.clientsDesc,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      data: { active: 45, new: 12, revenue: '€35,840' }
    },
    {
      id: 'vat',
      name: t.reports.types.vat,
      description: t.reports.types.vatDesc,
      icon: BarChart3,
      color: 'bg-yellow-100 text-yellow-600',
      data: { toPay: '€3,240', toReceive: '€1,850', balance: '€1,390' }
    },
    {
      id: 'assets',
      name: t.reports.types.assets,
      description: t.reports.types.assetsDesc,
      icon: Building2,
      color: 'bg-indigo-100 text-indigo-600',
      data: { total: '€125,000', depreciation: '€8,500', net: '€116,500' }
    }
  ]

  const recentReports = [
    {
      id: 1,
      name: t.reports.recent.monthlyJune,
      type: t.reports.recent.financial,
      generated: '2025-06-30T18:30:00',
      size: '2.1 MB',
      format: 'PDF'
    },
    {
      id: 2,
      name: t.reports.recent.expensesQ2,
      type: t.reports.recent.expenses,
      generated: '2025-06-28T14:15:00',
      size: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 3,
      name: t.reports.recent.vatQ2,
      type: t.reports.recent.vat,
      generated: '2025-06-25T10:00:00',
      size: '890 KB',
      format: 'PDF'
    }
  ]

  const handleGenerateReport = (reportType: string) => {
    console.log('Generating ${reportType} report...')
    // Implementation would generate and download report
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
                <h1 className="text-3xl font-bold text-foreground">{t.reports.title}</h1>
                <p className="text-gray-600 mt-1">{t.reports.subtitle}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-white rounded-lg border px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border-none outline-none bg-transparent"
                  >
                    <option value="week">{t.reports.filters.thisWeek}</option>
                    <option value="month">{t.reports.filters.thisMonth}</option>
                    <option value="quarter">{t.reports.filters.quarter}</option>
                    <option value="year">{t.reports.filters.year}</option>
                  </select>
                </div>
                <Button className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>{t.reports.exportAll}</span>
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.reports.metrics.revenue}</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">€45,230</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-sm text-green-600 mt-2">+12.5% vs mês anterior</div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.reports.metrics.expenses}</h3>
                    <p className="text-2xl font-bold text-red-600 mt-2">€23,150</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-sm text-red-600 mt-2">+5.2% vs mês anterior</div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.reports.metrics.profit}</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-2">€22,080</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Euro className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm text-blue-600 mt-2">+18.3% vs mês anterior</div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{t.reports.metrics.margin}</h3>
                    <p className="text-2xl font-bold text-purple-600 mt-2">48.8%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-sm text-purple-600 mt-2">+2.1% vs mês anterior</div>
              </div>
            </div>

            {/* Report Types */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">{t.reports.reportTypes.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                  <div key={report.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${report.color}`}>
                        <report.icon className="w-6 h-6" />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t.reports.generate}</span>
                      </Button>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">{report.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    <div className="text-sm space-y-1">
                      {Object.entries(report.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-500 capitalize">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{t.reports.recent.title}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder={t.reports.searchPlaceholder}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-600">{t.reports.table.name}</th>
                      <th className="text-left p-4 font-medium text-gray-600">{t.reports.table.type}</th>
                      <th className="text-left p-4 font-medium text-gray-600">{t.reports.table.date}</th>
                      <th className="text-left p-4 font-medium text-gray-600">{t.reports.table.size}</th>
                      <th className="text-left p-4 font-medium text-gray-600">{t.reports.table.format}</th>
                      <th className="text-right p-4 font-medium text-gray-600">{t.reports.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{report.name}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {new Date(report.generated).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="p-4 text-gray-600">{report.size}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-xs">
                            {report.format}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="mr-2">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}