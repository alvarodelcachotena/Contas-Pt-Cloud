'use client'

import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import ExpensesTable from "@/components/expenses-table"

export default function ExpensesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <ExpensesTable />
        </main>
      </div>
    </div>
  )
}