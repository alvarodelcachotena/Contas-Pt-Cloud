# 🤖 Sistema RAG Integrado - Documentação Completa

## 📋 Visão Geral

O sistema RAG (Retrieval-Augmented Generation) está completamente integrado com **TODAS** as tabelas da base de dados, permitindo que a IA acesse e analise dados em tempo real para fornecer respostas precisas e contextualizadas.

## 🗄️ TABELAS INTEGRADAS NO RAG

### 📊 **Tabelas Principais de Negócio**

| Tabela | Descrição | Dados Integrados |
|--------|-----------|------------------|
| `tenants` | Configuração multi-tenant | ID do tenant, configurações |
| `users` | Usuários do sistema | Permissões, roles, atividade |
| `clients` | Clientes e relacionamentos | NIF, email, histórico de faturas |
| `invoices` | Faturas e receitas | Valores, IVA, status, datas |
| `expenses` | Despesas e categorização | Categorias, valores, IVA |
| `payments` | Pagamentos e fluxo de caixa | Tipos, valores, referências |
| `bank_accounts` | Contas bancárias | Saldos, IBAN, configurações |
| `bank_transactions` | Transações bancárias | Movimentos, contrapartes, categorias |

### 🤖 **Tabelas de IA e RAG**

| Tabela | Descrição | Dados Integrados |
|--------|-----------|------------------|
| `documents` | Documentos processados | Status, confiança, método IA |
| `multi_agent_results` | Resultados do RAG | Confiança, tempo, documentos similares |
| `field_provenance` | Metadados de extração | Origem dos dados, confiança |
| `line_item_provenance` | Proveniência de linhas | Rastreabilidade de extração |
| `consensus_metadata` | Consenso entre modelos | Acordo entre agentes IA |
| `ai_chat_messages` | Histórico de chat | Contexto, respostas |

### 🔧 **Tabelas de Configuração**

| Tabela | Descrição | Dados Integrados |
|--------|-----------|------------------|
| `vat_rates` | Taxas de IVA | Regiões, categorias, taxas |
| `saft_exports` | Exportações SAFT | Períodos, status, arquivos |
| `cloud_drive_configs` | Configurações cloud | Dropbox, Google Drive |
| `webhook_credentials` | Credenciais webhook | Serviços externos |

## 🚀 **Funcionalidades RAG Integradas**

### 1. **Análise Financeira Completa**
- **Lucro e Margem**: Cálculo automático baseado em faturas e despesas
- **Fluxo de Caixa**: Análise de transações bancárias em tempo real
- **Tendências**: Comparação de períodos e identificação de padrões

### 2. **Análise de Clientes**
- **Top Clientes**: Ranking por valor faturado
- **Histórico**: Análise de pagamentos e relacionamento
- **Segmentação**: Por valor, frequência, região

### 3. **Análise de IVA**
- **Distribuição**: Por taxas (23%, 13%, 6%)
- **Regiões**: Mainland, Açores, Madeira
- **Categorias**: Normal, intermédio, reduzido

### 4. **Categorização de Despesas**
- **Análise por Categoria**: Maiores gastos, médias
- **Otimização**: Identificação de oportunidades de redução
- **Tendências**: Evolução temporal das categorias

### 5. **Sistema Multi-Agente**
- **Confiança**: Score médio de confiança das extrações
- **Documentos Similares**: RAG para contexto e validação
- **Tempo de Processamento**: Métricas de performance

## 📊 **Dados Disponíveis para a IA**

### **Estatísticas em Tempo Real**
```sql
-- Exemplo de consulta integrada
SELECT 
  COUNT(*) as total_invoices,
  SUM(total_amount) as total_revenue,
  AVG(vat_rate) as avg_vat_rate,
  COUNT(DISTINCT client_id) as unique_clients
FROM invoices 
WHERE tenant_id = ? AND status = 'paid'
```

### **Análise de Tendências**
- Últimos 3 meses vs período anterior
- Crescimento de receitas e despesas
- Sazonalidade identificada automaticamente

### **Insights Automáticos**
- Maior categoria de despesa
- Taxa de IVA mais comum
- Cliente com maior faturamento
- Padrões de pagamento

## 🧪 **Como Testar a Integração RAG**

### 1. **Script de Teste Automático**
```bash
node scripts/test-rag-integration.js
```

### 2. **Perguntas de Teste**
- "Faz uma análise completa da situação financeira"
- "Quais são os meus melhores clientes?"
- "Como está a distribuição do IVA?"
- "Quais insights posso extrair dos dados?"

### 3. **Verificação de Dados**
- Confirme se as tabelas existem
- Verifique se há dados nas tabelas principais
- Teste consultas específicas por área

## 🔍 **Exemplos de Respostas RAG**

### **Pergunta**: "Como está o meu negócio?"

**Resposta com RAG Integrado**:
```
📊 ANÁLISE COMPLETA DO SEU NEGÓCIO (RAG INTEGRADO):

💰 SITUAÇÃO FINANCEIRA:
• Total de Faturas: 45
• Receita Total: €67,500.00
• Total de Despesas: €42,300.00
• Lucro: €25,200.00
• Margem de Lucro: 37.33%

👥 RELACIONAMENTO COM CLIENTES:
• Total de Clientes: 23
• Top Cliente: Empresa ABC (€12,500 em 8 faturas)

🏦 INFRAESTRUTURA:
• Contas Bancárias: 3
• Transações Bancárias: 156
• Documentos Processados: 89

🤖 SISTEMA RAG:
• Resultados Multi-Agente: 67
• Confiança Média: 94.2%

💡 INSIGHTS AUTOMÁTICOS:
• IVA mais comum: 23% (38 faturas)
• Maior categoria de despesa: Serviços (€18,500)
• Padrão: 78% das faturas são pagas em 30 dias
```

## ⚡ **Performance e Otimizações**

### **Timeout Configurado**
- Consultas limitadas a 10 segundos
- Fallback para dados básicos em caso de timeout
- Cache automático de consultas frequentes

### **Consultas Otimizadas**
- Uso de índices apropriados
- Limitação de resultados (TOP 10)
- Agregações eficientes

### **Escalabilidade**
- Suporte multi-tenant
- Filtros automáticos por tenant_id
- RLS (Row Level Security) ativo

## 🔒 **Segurança e Privacidade**

### **Controle de Acesso**
- Todas as consultas filtradas por tenant_id
- RLS ativo em todas as tabelas
- Logs de acesso e auditoria

### **Dados Sensíveis**
- NIFs mascarados quando apropriado
- Valores financeiros em formato seguro
- Histórico de chat isolado por usuário

## 🚨 **Solução de Problemas**

### **Timeout na Base de Dados**
```
❌ Erro: ETIMEDOUT
```
**Solução**:
1. Verifique a conectividade com Supabase
2. Confirme se as tabelas existem
3. Execute o script de teste RAG

### **Dados Não Encontrados**
```
⚠️ Nenhuma fatura encontrada
```
**Solução**:
1. Verifique se há dados nas tabelas
2. Confirme o tenant_id correto
3. Teste consultas SQL diretas

### **Performance Lenta**
```
⏱️ Resposta demorou muito
```
**Solução**:
1. Verifique índices da base de dados
2. Otimize consultas complexas
3. Configure timeout apropriado

## 📈 **Métricas e Monitorização**

### **KPIs do Sistema RAG**
- Total de documentos processados
- Confiança média das extrações
- Tempo médio de processamento
- Taxa de sucesso das consultas

### **Logs de Sistema**
- Tentativas de API
- Fallbacks utilizados
- Erros de base de dados
- Performance das consultas

## 🎯 **Próximos Passos**

1. **Configure as APIs de IA** para funcionalidade completa
2. **Teste a integração RAG** com o script automático
3. **Explore as funcionalidades** com perguntas específicas
4. **Monitore a performance** e ajuste conforme necessário

---

## 🏆 **Status da Integração RAG**

✅ **COMPLETAMENTE INTEGRADO** com todas as tabelas da base de dados  
✅ **Sistema multi-agente** funcionando  
✅ **Análise em tempo real** disponível  
✅ **Fallback offline** implementado  
✅ **Segurança e performance** otimizados  

**O sistema RAG está pronto para fornecer insights profundos sobre o seu negócio! 🚀**
