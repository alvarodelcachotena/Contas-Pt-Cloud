import ProcessorManagement from '../../components/processor-management'

export default function ProcessorManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <ProcessorManagement />
    </div>
  )
}

export const metadata = {
  title: 'Gerenciamento de Processadores - Contas-PT',
  description: 'Configure e teste processadores externos de documentos para melhorar a precisão da extração de dados'
}