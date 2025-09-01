'use client'

import { Suspense } from 'react'
import RegisterForm from '@/components/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Crear nueva cuenta
          </h2>
          <p className="text-muted-foreground mt-2">
            Regístrate para acceder al sistema Contas-PT
          </p>
        </div>
        
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
