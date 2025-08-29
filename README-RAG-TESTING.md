# 🧪 Como Testar o Sistema RAG - Base de Dados

## 📋 Visão Geral

Este documento explica como testar se o sistema RAG está funcionando corretamente e integrado com a base de dados.

## 🚀 Passos para Testar

### 1. **Verificar Configuração da Base de Dados**

Primeiro, execute o script de teste simples:

```bash
node scripts/test-simple-database.js
```

Este script irá:
- ✅ Verificar se as variáveis de ambiente estão configuradas
- ✅ Testar a conexão com Supabase
- ✅ Executar uma consulta simples para verificar se as tabelas existem

### 2. **Testar o Chatbot com Perguntas de Negócio**

Acesse o chatbot em `/ai-assistant` e faça perguntas como:

- **"Quantas faturas tenho?"**
- **"Qual é o meu lucro atual?"**
- **"Quantos clientes tenho?"**
- **"Mostra-me as minhas despesas recentes"**
- **"Como está a situação financeira do meu negócio?"**

### 3. **Verificar se a IA Está Usando Dados da Base de Dados**

A IA deve responder com informações específicas como:
- Números exatos de faturas, despesas, clientes
- Valores monetários reais
- Datas de documentos recentes
- Cálculos de lucro e margem

## 🔍 **O que Procurar nas Respostas**

### ✅ **Respostas Corretas (RAG Funcionando)**
```
📊 DADOS DO SEU NEGÓCIO (OBTIDOS DA BASE DE DADOS):

• Total de Faturas: 15
• Total de Despesas: 8
• Receita Total: €2,500.00
• Lucro: €1,200.00
• Margem de Lucro: 48.00%
```

### ❌ **Respostas Incorretas (RAG Não Funcionando)**
```
Não tenho acesso aos dados específicos do seu negócio.
Preciso de mais informações para responder.
```

## 🚨 **Problemas Comuns e Soluções**

### **1. Erro de Conexão com Base de Dados**
```
❌ Erro na conexão com base de dados: CONNECT_TIMEOUT
```

**Solução:**
- Verifique se `SUPABASE_URL` está correta no `.env`
- Confirme se o Supabase está acessível
- Teste a conectividade de rede

### **2. Tabelas Não Existem**
```
❌ Erro ao consultar faturas: relation "invoices" does not exist
```

**Solução:**
- Execute os scripts SQL de criação de tabelas
- Verifique se o schema está correto
- Confirme se está no tenant correto

### **3. Sem Dados nas Tabelas**
```
⚠️ Nenhuma fatura encontrada
```

**Solução:**
- Insira dados de teste nas tabelas
- Verifique se o `tenant_id` está correto
- Confirme se as permissões estão configuradas

## 🧪 **Scripts de Teste Disponíveis**

### **Teste Básico de Conexão**
```bash
node scripts/test-simple-database.js
```

### **Teste Completo do Sistema**
```bash
node scripts/test-rag-integration.js
```

### **Teste do Modo Offline**
```bash
node scripts/test-offline-mode.js
```

## 📊 **Verificação de Funcionamento**

### **1. Logs do Console**
Procure por estas mensagens no console:
```
✅ Conexão com BD testada com sucesso
✅ Dados básicos obtidos: { invoices: 15, expenses: 8, clients: 12, profit: 1200 }
🔄 Tentando Google AI (Gemini) como resposta principal...
🔄 Ambas as APIs falharam, usando dados da BD...
```

### **2. Resposta da API**
A resposta deve incluir:
```json
{
  "success": true,
  "response": "📊 DADOS DO SEU NEGÓCIO...",
  "model": "Dados da Base de Dados (Fallback)",
  "databaseDataUsed": true
}
```

## 🎯 **Próximos Passos Após Teste**

1. **Se o RAG estiver funcionando:**
   - Configure as APIs de IA para funcionalidade completa
   - Teste perguntas mais complexas
   - Explore todas as funcionalidades

2. **Se o RAG não estiver funcionando:**
   - Verifique a conectividade com Supabase
   - Confirme se as tabelas existem e têm dados
   - Execute os scripts de teste para diagnosticar

## 🔧 **Configuração das APIs de IA**

Para funcionalidade completa, configure no `.env`:

```env
# Google AI (Principal)
GOOGLE_AI_API_KEY=sua_chave_aqui

# OpenAI (Fallback)
OPENAI_API_KEY=sua_chave_aqui
```

## 📈 **Monitorização Contínua**

- Verifique os logs do console regularmente
- Monitore o tempo de resposta das consultas
- Teste periodicamente com perguntas de negócio
- Verifique se novos dados estão sendo lidos corretamente

---

## 🏆 **Status do Sistema RAG**

✅ **Base de dados integrada**  
✅ **Consultas funcionando**  
✅ **Fallback offline implementado**  
✅ **Sistema multi-tenant suportado**  
✅ **Tratamento de erros robusto**  

**O sistema RAG está pronto para fornecer insights baseados nos dados reais do seu negócio! 🚀**
