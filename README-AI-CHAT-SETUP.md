# 🤖 Sistema de Chat AI - Configuração e Uso

## 📋 Visão Geral

Este sistema de chat AI foi desenvolvido para funcionar mesmo quando as APIs externas (Google AI, OpenAI) estão indisponíveis. Ele utiliza um sistema de fallback inteligente que:

1. **Tenta usar Google AI (Gemini) como principal**
2. **Faz fallback para OpenAI se Google AI falhar**
3. **Responde com dados da base de dados se ambas as APIs falharem**

## 🚀 Configuração Rápida

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp env-example.txt .env
```

Edite o arquivo `.env` e configure:

```env
# APIs de IA (pelo menos uma é necessária)
GOOGLE_AI_API_KEY=sua_chave_google_ai_aqui
OPENAI_API_KEY=sua_chave_openai_aqui

# Base de Dados Supabase
SUPABASE_URL=sua_url_supabase_aqui
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

### 2. Obter Chaves API

#### Google AI (Gemini)
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie um projeto ou selecione um existente
3. Gere uma chave API
4. Copie para `GOOGLE_AI_API_KEY`

#### OpenAI
1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta
3. Gere uma nova chave API
4. Copie para `OPENAI_API_KEY`

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar o Sistema

```bash
npm run dev
```

## 🧪 Testar o Sistema

Execute o script de teste:

```bash
node scripts/test-ai-chat-system.js
```

## 💡 Como Funciona

### Modo Online (APIs funcionando)
- **Google AI**: Resposta principal com contexto português
- **OpenAI**: Fallback se Google AI falhar
- **Dados da BD**: Incluídos automaticamente quando relevante

### Modo Offline (APIs indisponíveis)
- **Base de Dados**: Responde com dados reais do negócio
- **Estatísticas**: Lucro, faturas, despesas, clientes
- **Histórico**: Faturas e despesas recentes

## 📊 Perguntas Suportadas

### Com APIs de IA
- "Qual é o meu lucro atual?"
- "Quantas faturas tenho este mês?"
- "Como posso reduzir minhas despesas?"
- "Quais são as melhores práticas de IVA em Portugal?"

### Modo Offline (apenas BD)
- "Quantas faturas tenho?"
- "Qual é o total de despesas?"
- "Quantos clientes tenho?"
- "Qual é o meu lucro?"

## 🔧 Solução de Problemas

### Erro 503 - Serviço Indisponível
```
❌ Erro: HTTP error! status: 503
```

**Solução:**
1. Verifique se as chaves API estão corretas
2. Confirme se as APIs têm créditos disponíveis
3. O sistema funcionará em modo offline

### Erro de Conexão com Base de Dados
```
❌ Erro na conexão com a base de dados
```

**Solução:**
1. Verifique as credenciais do Supabase
2. Confirme se a base de dados está acessível
3. Execute o script de teste para diagnóstico

### APIs Não Configuradas
```
⚠️ Nenhuma API de IA configurada
```

**Solução:**
1. Configure pelo menos uma API no arquivo `.env`
2. O sistema funcionará apenas com dados da base de dados

## 📈 Monitorização

### Logs do Servidor
O sistema registra todas as operações:
- Tentativas de API
- Fallbacks utilizados
- Erros e sucessos
- Uso de dados da base de dados

### Métricas de Resposta
- Modelo utilizado
- Tempo de resposta
- Fallback utilizado
- Dados da BD utilizados

## 🎯 Exemplos de Uso

### Pergunta sobre Lucro
**Usuário:** "Qual é o meu lucro atual?"

**Resposta (com APIs):**
```
📊 Com base nos seus dados atuais:

✅ Seu lucro atual é de €2,450.00

Detalhes:
• Receita Total: €8,750.00
• Total de Despesas: €6,300.00
• Lucro: €2,450.00

Este é um resultado positivo! Suas receitas estão superando suas despesas.
```

**Resposta (modo offline):**
```
📊 DADOS DO SEU NEGÓCIO:

• Total de Faturas: 15
• Total de Despesas: 8
• Total de Clientes: 12
• Receita Total: €8,750.00
• Total de Despesas: €6,300.00
• Lucro: €2,450.00

✅ Seu negócio está com lucro!
```

## 🔒 Segurança

- Todas as consultas à base de dados usam RLS (Row Level Security)
- Dados são filtrados por tenant_id
- APIs externas não têm acesso direto à base de dados
- Logs não incluem dados sensíveis

## 📚 Recursos Adicionais

- [Documentação da API](docs/api-reference.md)
- [Arquitetura do Sistema](docs/COMPLETE_PROJECT_DOCUMENTATION.md)
- [Configuração de Base de Dados](docs/DATABASE_ARCHITECTURE.md)
- [Sistema de Webhooks](docs/WEBHOOK_INTEGRATION_SUMMARY.md)

## 🆘 Suporte

Se encontrar problemas:

1. Execute o script de teste
2. Verifique os logs do servidor
3. Confirme a configuração das variáveis de ambiente
4. Teste a conexão com a base de dados

## 🚀 Próximos Passos

1. Configure suas APIs de IA
2. Teste o sistema com perguntas simples
3. Explore as funcionalidades avançadas
4. Personalize os prompts para seu negócio

---

**Sistema desenvolvido para funcionar 24/7, mesmo offline! 🎉**
