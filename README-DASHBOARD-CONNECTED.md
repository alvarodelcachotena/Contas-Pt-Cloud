# 🎯 Dashboard Conectado à Base de Dados

## ✅ **Status: CONECTADO Y FUNCIONANDO**

Tu dashboard ahora está **completamente conectado** a las tablas de la base de datos y muestra datos reales en tiempo real.

## 📊 **Métricas Conectadas**

### 🔢 **Contadores Principales**
- **Documentos**: Total de documentos subidos (processados + pendentes)
- **Faturas**: Total de faturas criadas
- **Despesas**: Total de despesas registradas
- **Clientes**: Total de clientes cadastrados

### 💰 **Métricas Financeiras**
- **Receita Total**: Soma de todas as faturas pagas
- **Despesas Total**: Soma de todas as despesas
- **Lucro Líquido**: Receita - Despesas

### 📅 **Métricas do Mês Atual**
- **Receita do Mês**: Faturas emitidas no mês atual
- **Despesas do Mês**: Despesas registradas no mês atual
- **Lucro do Mês**: Lucro líquido do mês atual

### 📈 **Status de Processamento**
- **Taxa de Sucesso**: Percentagem de documentos processados com sucesso
- **Documentos Processados**: Total de documentos já processados
- **Documentos Pendentes**: Total de documentos aguardando processamento

## 🗄️ **Tabelas Conectadas**

| Métrica | Tabela | Campo | Descrição |
|---------|--------|-------|-----------|
| **Documentos** | `documents` + `raw_documents` | `COUNT(*)` | Total de documentos subidos |
| **Faturas** | `invoices` | `COUNT(*)` | Total de faturas |
| **Despesas** | `expenses` | `COUNT(*)` | Total de despesas |
| **Clientes** | `clients` | `COUNT(*)` | Total de clientes |
| **Receita** | `invoices` | `SUM(total_amount)` | Soma de faturas pagas |
| **Despesas** | `expenses` | `SUM(amount)` | Soma de todas as despesas |

## 🚀 **Como Funciona**

### 1. **API de Métricas** (`/api/dashboard/metrics`)
- Conecta diretamente ao Supabase
- Executa consultas SQL em tempo real
- Retorna dados formatados para o dashboard

### 2. **Componente Dashboard** (`components/dashboard.tsx`)
- Usa React Query para buscar dados
- Atualiza automaticamente a cada 30 segundos
- Exibe métricas em cards visuais

### 3. **Atualização em Tempo Real**
- **Auto-refresh**: A cada 30 segundos
- **Dados Reais**: Sempre conectado à base de dados
- **Performance**: Consultas otimizadas com índices

## 📱 **Interface Visual**

### **Cards Principais**
- 🧾 **Faturas**: Contador + ícone azul
- 💸 **Despesas**: Contador + ícone vermelho  
- 📄 **Documentos**: Contador + status de processamento
- 👥 **Clientes**: Contador + ícone roxo

### **Visão Financeira**
- 💚 **Receita Total**: Valor + comparação mensal
- 🔴 **Despesas Total**: Valor + comparação mensal
- 💰 **Lucro Líquido**: Valor + indicador de cor

### **Status de Processamento**
- 📊 **Taxa de Sucesso**: Barra de progresso visual
- ⏳ **Documentos Pendentes**: Indicador laranja
- ✅ **Documentos Processados**: Indicador verde

## 🧪 **Testando o Dashboard**

### **1. Inserir Dados de Teste**
```sql
-- Executar o script de dados de teste
\i scripts/test-dashboard-data.sql
```

### **2. Verificar Métricas Esperadas**
- **Documentos**: 6 total (4 processados + 2 pendentes)
- **Faturas**: 4 total (3 pagas + 1 pendente)
- **Despesas**: 4 total
- **Clientes**: 3 total
- **Receita**: €4,551.00 (faturas pagas)
- **Despesas**: €1,950.00
- **Lucro**: €2,601.00

### **3. Acessar o Dashboard**
- Navegar para `/dashboard`
- Verificar se os números correspondem aos dados
- Testar atualização automática (30 segundos)

## 🔧 **Configuração Técnica**

### **Variáveis de Ambiente**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Dependências**
- `@supabase/supabase-js` - Cliente Supabase
- `@tanstack/react-query` - Gerenciamento de estado
- `tailwindcss` - Estilos CSS

### **Arquivos Principais**
- `app/api/dashboard/metrics/route.ts` - API de métricas
- `components/dashboard.tsx` - Componente visual
- `app/dashboard/page.tsx` - Página do dashboard

## 📈 **Exemplos de Consultas SQL**

### **Contar Documentos por Status**
```sql
SELECT 
  COUNT(*) as total_documents,
  COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM documents 
WHERE tenant_id = 1;
```

### **Calcular Receita Mensal**
```sql
SELECT 
  DATE_TRUNC('month', issue_date) as month,
  SUM(total_amount) as revenue
FROM invoices 
WHERE tenant_id = 1 AND status = 'paid'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC;
```

## 🎉 **Resultado Final**

✅ **Dashboard conectado à base de dados**  
✅ **Métricas em tempo real**  
✅ **Interface visual moderna**  
✅ **Atualização automática**  
✅ **Dados reais das tabelas**  

Agora quando subires **20 documentos**, o recuadro de documentos mostrará **20** em tempo real! 🚀

---

**Nota**: O dashboard está configurado para o tenant ID 1. Para múltiplos tenants, ajustar o header `x-tenant-id` na API.

