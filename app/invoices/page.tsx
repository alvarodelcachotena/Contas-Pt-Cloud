'use client'

import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import InvoicesTable from "@/components/invoices-table"

export default function InvoicesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <InvoicesTable />
        </main>
      </div>
    </div>
  )
}