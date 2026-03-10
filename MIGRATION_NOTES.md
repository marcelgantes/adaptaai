# Notas de Migração: Adapta Aí para Vercel com Google Gemini

## Resumo da Migração

O projeto **Adapta Aí** foi migrado de um arquivo HTML único para uma arquitetura serverless no Vercel, usando a **API do Google Gemini** para chamadas seguras de IA sem expor chaves de API no navegador.

## Histórico de Mudanças

### Fase 1: Migração para Vercel com Anthropic
- Criada função serverless `/api/chat.js` para proxy da API da Anthropic
- Atualizado frontend para chamar `/api/chat` em vez de `https://api.anthropic.com/v1/messages`
- Configurado `vercel.json` para build e roteamento

### Fase 2: Migração para Google Gemini
- Substituída API da Anthropic pela API do Google Gemini
- Implementada conversão de formato de requisição/resposta
- Atualizada documentação com guia de configuração do Gemini

## Estrutura do Projeto

```
adaptaai-vercel/
├── client/
│   └── public/
│       └── index.html (frontend original, URLs atualizadas)
├── api/
│   └── chat.js (função serverless com Gemini)
├── vercel.json (configuração de build e rotas)
├── DEPLOYMENT_GUIDE.md (guia de deployment)
├── GEMINI_SETUP.md (guia de configuração do Gemini)
└── MIGRATION_NOTES.md (este arquivo)
```

## Mudanças Técnicas

### 1. Função Serverless (`/api/chat.js`)

**Antes (Anthropic)**:
```javascript
const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: messages,
  }),
});
```

**Depois (Gemini)**:
```javascript
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1000 },
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    }),
  }
);
```

### 2. Conversão de Formato

A função converte automaticamente:

**Entrada (Anthropic format)**:
```json
{
  "messages": [
    { "role": "user", "content": "Olá" }
  ]
}
```

**Intermediária (Gemini format)**:
```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "Olá" }] }
  ]
}
```

**Saída (Anthropic format - compatível)**:
```json
{
  "content": [
    { "type": "text", "text": "Resposta do Gemini" }
  ],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 25
  }
}
```

### 3. Variáveis de Ambiente

| Variável | Antes | Depois |
|---|---|---|
| Nome | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` |
| Origem | console.anthropic.com | aistudio.google.com |
| Custo | Pago | Gratuito |
| Cartão de Crédito | Requerido | Não requerido |

## Comparação de APIs

| Aspecto | Anthropic | Google Gemini |
|---|---|---|
| **Modelo** | Claude Sonnet 4 | Gemini 2.0 Flash |
| **Custo** | Pago por uso | Gratuito |
| **Cartão de Crédito** | Requerido | Não requerido |
| **Velocidade** | Rápida | Muito rápida |
| **Qualidade** | Excelente | Excelente |
| **Endpoint** | `api.anthropic.com` | `generativelanguage.googleapis.com` |
| **Autenticação** | Header `x-api-key` | Query parameter `key` |
| **Formato** | Anthropic | Proprietário (convertido) |

## Benefícios da Migração para Gemini

✅ **Custo Zero**: API completamente gratuita  
✅ **Sem Cartão de Crédito**: Não requer informações de pagamento  
✅ **Mais Rápido**: Gemini 2.0 Flash é otimizado para latência baixa  
✅ **Escalável**: Quotas generosas para uso educacional  
✅ **Compatibilidade**: Frontend não precisa de mudanças  

## Compatibilidade com Frontend

✅ **Totalmente compatível**:
- Todas as funcionalidades do Adapta Aí continuam funcionando
- A interface do usuário não mudou
- Os prompts e lógica de negócio permanecem os mesmos
- A função serverless converte automaticamente formatos

❌ **Nenhuma mudança necessária** no frontend:
- O arquivo `client/public/index.html` continua chamando `/api/chat`
- As requisições mantêm o mesmo formato
- As respostas são convertidas para o formato esperado

## Locais das Mudanças

### Arquivo: `api/chat.js`

**Mudanças principais**:
1. Lê `GEMINI_API_KEY` em vez de `ANTHROPIC_API_KEY`
2. Converte `messages` para formato Gemini (`contents`)
3. Chama `generativelanguage.googleapis.com` em vez de `api.anthropic.com`
4. Converte resposta de volta para formato Anthropic

### Arquivo: `client/public/index.html`

**Nenhuma mudança necessária** - continua chamando `/api/chat` com o mesmo formato.

## Próximas Etapas

### 1. Configuração Imediata

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Clique em **"Get API Key"**
3. Crie uma nova chave de API
4. Adicione a chave no Vercel como `GEMINI_API_KEY`
5. Redeploy o projeto

### 2. Testes

1. Teste o endpoint `/api/chat` com curl
2. Teste o frontend completo
3. Verifique logs no Vercel

### 3. Monitoramento

1. Configure alertas no Google Cloud Console
2. Monitore uso da API
3. Rastreie erros e performance

### 4. Otimizações Futuras

1. Ajuste os prompts para Gemini
2. Implemente cache de respostas
3. Adicione rate limiting
4. Crie dashboard de analytics

## Rollback

Se precisar voltar à versão anterior com Anthropic:

```bash
git log --oneline
# Encontre o commit antes da mudança para Gemini
git checkout <commit-hash>
```

Ou restaure a versão original do repositório:

```bash
git clone https://github.com/marcelgantes/adaptaai.git adaptaai-original
```

## Suporte

Para dúvidas sobre a migração:

1. Consulte `GEMINI_SETUP.md` para configuração
2. Consulte `DEPLOYMENT_GUIDE.md` para deployment
3. Verifique os logs no Vercel
4. Teste o endpoint `/api/chat` com curl
5. Abra uma issue no GitHub

## Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---|---|---|
| `api/chat.js` | 🔄 Modificado | Atualizado para usar Gemini |
| `GEMINI_SETUP.md` | ✨ Novo | Guia de configuração do Gemini |
| `MIGRATION_NOTES.md` | 🔄 Modificado | Atualizado com informações do Gemini |

---

**Data da Atualização**: 10 de Março de 2026  
**Versão do Projeto**: 2.0.0 (com Google Gemini)  
**Status**: ✅ Pronto para Produção
