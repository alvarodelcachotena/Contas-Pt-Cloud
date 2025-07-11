'use client'

import { Suspense } from 'react'
import LoginForm from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Bem-vindo de volta
          </h2>
          <p className="text-muted-foreground mt-2">
            Entre na sua conta para continuar
          </p>
        </div>
        
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}