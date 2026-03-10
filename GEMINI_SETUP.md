# Configuração do Google Gemini no Adapta Aí

## 🎯 Visão Geral

O projeto Adapta Aí foi atualizado para usar a **API do Google Gemini** em vez da Anthropic. A API do Gemini é **gratuita** e não requer cartão de crédito, tornando o projeto mais acessível.

## ✅ Vantagens do Google Gemini

| Aspecto | Gemini | Anthropic |
|---|---|---|
| **Custo** | 🟢 Gratuito | 🔴 Pago |
| **Cartão de Crédito** | 🟢 Não requer | 🔴 Requer |
| **Modelo** | Gemini 2.0 Flash | Claude Sonnet 4 |
| **Velocidade** | ⚡ Muito rápido | ⚡ Rápido |
| **Qualidade** | 🟢 Excelente | 🟢 Excelente |

## 📋 Pré-requisitos

1. **Conta do Google** (Gmail ou Google Workspace)
2. **Acesso ao AI Studio** (gratuito)
3. **Projeto no Vercel** (já configurado)

## 🚀 Passos para Configuração

### 1. Obter a Chave de API do Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em **"Get API Key"** (canto superior direito)
3. Clique em **"Create API Key"**
4. Selecione **"Create new API key in new project"**
5. Copie a chave gerada (ela aparecerá em um modal)

**Exemplo de chave**:
```
AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Adicionar a Chave no Vercel

1. Acesse seu projeto no Vercel: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique no projeto **adaptaai**
3. Vá para **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Cole a chave do Gemini
   - **Environments**: Selecione `Production`, `Preview`, `Development`
6. Clique em **Save**

### 3. Redeploy no Vercel

1. Vá para **Deployments** no seu projeto
2. Clique em **Redeploy** no deployment mais recente
3. Aguarde o build completar

## 🧪 Testar a Integração

### Via cURL

```bash
curl -X POST https://seu-projeto.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Olá, qual é o seu nome?"
      }
    ]
  }'
```

**Resposta esperada**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Olá! Sou o Gemini, um assistente de IA do Google..."
    }
  ],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 25
  }
}
```

### Via Frontend

1. Acesse `https://seu-projeto.vercel.app`
2. Faça login
3. Tente usar as funcionalidades de IA:
   - Gerar adaptações de texto
   - Criar pictogramas
   - Gerar PEI

## 🔄 Mudanças Técnicas

### Função Serverless (`/api/chat.js`)

A função foi atualizada para:

1. **Receber requisições** no formato Anthropic (compatível com o frontend existente)
2. **Converter para formato Gemini** (estrutura de messages diferente)
3. **Chamar a API do Gemini** usando a chave de ambiente
4. **Converter a resposta** de volta para formato Anthropic

**Fluxo**:
```
Frontend (Anthropic format)
    ↓
/api/chat.js (converte para Gemini format)
    ↓
Google Gemini API
    ↓
/api/chat.js (converte de volta para Anthropic format)
    ↓
Frontend (recebe resposta compatível)
```

### Endpoint da API

**Antes**:
```
https://api.anthropic.com/v1/messages
```

**Depois**:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

### Formato de Requisição

**Antes (Anthropic)**:
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

**Depois (Gemini)**:
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "..." }]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 1000,
    "temperature": 0.7
  }
}
```

## 🛡️ Segurança

✅ **O que está seguro**:
- A chave de API do Gemini nunca é exposta no navegador
- Todas as chamadas passam pelo backend serverless
- As variáveis de ambiente são criptografadas no Vercel

⚠️ **O que você deve fazer**:
- Nunca compartilhe sua chave de API
- Monitore o uso da API no Google Cloud Console
- Configure limites de quota se necessário

## 📊 Monitoramento de Uso

### No Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Selecione seu projeto
3. Vá para **APIs & Services** → **Credentials**
4. Clique em sua API Key
5. Vá para **Quotas** para ver o uso

### No Vercel

1. Acesse seu projeto no Vercel
2. Vá para **Monitoring** para ver:
   - Requisições por segundo
   - Tempo de resposta
   - Erros

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY is not set"

**Causa**: Variável de ambiente não configurada no Vercel

**Solução**:
1. Vá para **Settings** → **Environment Variables**
2. Verifique se `GEMINI_API_KEY` está presente
3. Redeploy o projeto

### Erro: "Error calling Gemini API"

**Causa**: Chave de API inválida ou expirada

**Solução**:
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Gere uma nova chave de API
3. Atualize a variável de ambiente no Vercel
4. Redeploy

### Resposta vazia do Gemini

**Causa**: Prompt muito restritivo ou modelo recusando responder

**Solução**:
1. Verifique o prompt enviado
2. Tente com um prompt mais simples
3. Verifique os logs no Vercel

## 📚 Recursos

- **Google AI Studio**: [aistudio.google.com](https://aistudio.google.com)
- **Documentação Gemini**: [ai.google.dev](https://ai.google.dev)
- **Documentação Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Repositório**: [github.com/marcelgantes/adaptaai](https://github.com/marcelgantes/adaptaai)

## 🎓 Próximos Passos

1. **Otimizar prompts**: Ajuste os prompts para melhorar a qualidade das respostas do Gemini
2. **Adicionar cache**: Implemente cache de respostas para reduzir custos
3. **Monitorar uso**: Acompanhe o uso da API para evitar limites
4. **Expandir funcionalidades**: Use novos recursos do Gemini (visão, etc.)

---

**Data de Atualização**: 10 de Março de 2026  
**Status**: ✅ Pronto para Produção
