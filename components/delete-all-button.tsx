'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteAllButtonProps {
  entityName: string
  entityNamePlural: string
  apiEndpoint: string
  onSuccess?: () => void
  className?: string
}

export default function DeleteAllButton({
  entityName,
  entityNamePlural,
  apiEndpoint,
  onSuccess,
  className
}: DeleteAllButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeleteAll = async () => {
    setLoading(true)

    try {
      console.log(`🗑️ Attempting to delete all ${entityNamePlural} from ${apiEndpoint}`)

      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log(`📡 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP Error ${response.status}:`, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log(`📄 Response data:`, result)

      if (result.success) {
        setShowDialog(false)
        if (onSuccess) {
          onSuccess()
        }
        console.log(`✅ All ${entityNamePlural} deleted successfully`)
      } else {
        throw new Error(result.error || `Failed to delete all ${entityNamePlural}`)
      }

    } catch (error) {
      console.error(`❌ Error deleting all ${entityNamePlural}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={`text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-1 ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        <span>Eliminar Todos</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Confirmar Eliminação</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Atenção: Esta ação não pode ser desfeita!
              </p>
              <p className="text-red-700">
                Tem certeza de que deseja eliminar <strong>todos os {entityNamePlural}</strong>?
                Esta ação irá remover permanentemente todos os registros da base de dados.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>O que será eliminado:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os {entityNamePlural} associados ao seu tenant</li>
                <li>Dados relacionados e histórico</li>
                <li>Esta ação é irreversível</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Eliminando...' : `Eliminar Todos os ${entityNamePlural}`}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
