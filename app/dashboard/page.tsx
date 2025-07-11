'use client'

import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import Dashboard from "@/components/dashboard"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  )
}