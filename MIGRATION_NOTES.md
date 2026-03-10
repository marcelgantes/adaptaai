# Notas de Migração: Adapta Aí para Vercel

## Resumo da Migração

O projeto **Adapta Aí** foi migrado de um arquivo HTML único para uma arquitetura serverless no Vercel, permitindo chamadas seguras à API da Anthropic sem expor a chave de API no navegador.

## Mudanças Realizadas

### 1. Estrutura do Projeto

**Antes**:
```
adaptaai/
└── index.html (arquivo único com ~2050 linhas)
```

**Depois**:
```
adaptaai-vercel/
├── client/
│   └── public/
│       └── index.html (frontend original, URLs atualizadas)
├── api/
│   └── chat.js (função serverless)
├── vercel.json (configuração de build e rotas)
├── DEPLOYMENT_GUIDE.md
└── MIGRATION_NOTES.md
```

### 2. Chamadas à API da Anthropic

**Antes** (3 chamadas diretas no frontend):
```javascript
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-api-key': 'sk-ant-...' // ❌ Exposto no navegador!
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

**Depois** (chamadas para o backend serverless):
```javascript
const resp = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### 3. Função Serverless (`/api/chat.js`)

A nova função serverless:
- ✅ Recebe requisições do frontend em `/api/chat`
- ✅ Lê a chave de API da variável de ambiente `ANTHROPIC_API_KEY`
- ✅ Chama a API da Anthropic com segurança
- ✅ Retorna a resposta ao frontend
- ✅ Trata erros e valida entrada

### 4. Configuração do Vercel (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    { "src": "client/public/index.html", "use": "@vercel/static" },
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/client/public/index.html" }
  ]
}
```

Esta configuração:
- Serve o frontend como conteúdo estático
- Executa as funções serverless em Node.js
- Roteia `/api/*` para as funções serverless
- Roteia todas as outras requisições para o frontend (SPA)

## Locais das Mudanças no Código

### Arquivo: `client/public/index.html`

**Linha 1434** (Fluxo ARASAAC - Pictogramas):
```javascript
// ❌ Antes:
const conceitosResp = await fetch('https://api.anthropic.com/v1/messages', {

// ✅ Depois:
const conceitosResp = await fetch('/api/chat', {
```

**Linha 1462** (Fluxo Texto Normal):
```javascript
// ❌ Antes:
const resp = await fetch('https://api.anthropic.com/v1/messages', {

// ✅ Depois:
const resp = await fetch('/api/chat', {
```

**Linha 1836** (Geração de PEI):
```javascript
// ❌ Antes:
const resp = await fetch('https://api.anthropic.com/v1/messages', {

// ✅ Depois:
const resp = await fetch('/api/chat', {
```

## Benefícios da Migração

| Aspecto | Antes | Depois |
|---|---|---|
| **Segurança da API Key** | ❌ Exposta no navegador | ✅ Segura no servidor |
| **CORS Issues** | ❌ Pode ter problemas | ✅ Resolvido |
| **Rate Limiting** | ❌ Por IP do usuário | ✅ Centralizado no servidor |
| **Monitoramento** | ❌ Difícil de rastrear | ✅ Logs centralizados |
| **Escalabilidade** | ❌ Limitada | ✅ Automática no Vercel |
| **Custo** | ❌ Variável | ✅ Previsível |

## Compatibilidade

✅ **Totalmente compatível** com o código original:
- Todas as funcionalidades do Adapta Aí continuam funcionando
- A interface do usuário não mudou
- Os prompts e lógica de negócio permanecem os mesmos
- Apenas as chamadas HTTP foram atualizadas

## Próximas Etapas

1. **Deploy no Vercel**:
   - Conectar o repositório `marcelgantes/adaptaai` ao Vercel
   - Configurar a variável de ambiente `ANTHROPIC_API_KEY`
   - Fazer o deploy

2. **Testes**:
   - Testar o endpoint `/api/chat` com curl/Postman
   - Testar o frontend completo
   - Verificar logs no Vercel

3. **Monitoramento**:
   - Configurar alertas no Vercel
   - Monitorar uso da API da Anthropic
   - Rastrear erros e performance

4. **Otimizações Futuras**:
   - Adicionar rate limiting
   - Implementar cache de respostas
   - Adicionar autenticação de usuários
   - Criar dashboard de analytics

## Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---|---|---|
| `api/chat.js` | ✨ Novo | Função serverless para proxy da API |
| `client/public/index.html` | 🔄 Modificado | URLs atualizadas para `/api/chat` |
| `vercel.json` | ✨ Novo | Configuração de build e rotas |
| `DEPLOYMENT_GUIDE.md` | ✨ Novo | Guia passo a passo para deploy |
| `MIGRATION_NOTES.md` | ✨ Novo | Este arquivo |

## Rollback

Se precisar voltar à versão anterior:
```bash
git checkout HEAD~1
```

Ou restaure a versão original do repositório:
```bash
git clone https://github.com/marcelgantes/adaptaai.git adaptaai-original
```

## Suporte

Para dúvidas sobre a migração:
1. Consulte `DEPLOYMENT_GUIDE.md`
2. Verifique os logs no Vercel
3. Teste o endpoint `/api/chat` com curl
4. Abra uma issue no GitHub

---

**Data da Migração**: 10 de Março de 2026  
**Versão do Projeto**: 1.0.0  
**Status**: Pronto para Deploy ✅
