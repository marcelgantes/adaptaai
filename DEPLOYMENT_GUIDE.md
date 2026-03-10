# Guia de Deployment do Adapta Aí no Vercel

## Visão Geral

Este projeto foi migrado para o Vercel com uma arquitetura serverless que garante a segurança da sua chave de API da Anthropic. O frontend chama um endpoint backend (`/api/chat`) em vez de chamar a API da Anthropic diretamente, eliminando problemas de CORS e mantendo suas credenciais seguras.

## Arquitetura

| Componente | Localização | Descrição |
|---|---|---|
| **Frontend** | `/client/public/index.html` | Aplicação Adapta Aí original com chamadas fetch atualizadas |
| **Backend Serverless** | `/api/chat.js` | Função Node.js que proxy as requisições para a API da Anthropic |
| **Configuração Vercel** | `vercel.json` | Define builds, routes e variáveis de ambiente |

## Pré-requisitos

1. **Conta no Vercel**: Crie uma em [vercel.com](https://vercel.com)
2. **Chave de API da Anthropic**: Obtenha em [console.anthropic.com](https://console.anthropic.com)
3. **Repositório GitHub**: O código já está em `marcelgantes/adaptaai`

## Passos para Deploy

### 1. Conectar o Repositório ao Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Git Repository"
3. Selecione `marcelgantes/adaptaai`
4. Clique em "Import"

### 2. Configurar Variáveis de Ambiente

Na página de configuração do projeto no Vercel:

1. Vá para **Settings** → **Environment Variables**
2. Adicione uma nova variável:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Cole sua chave de API da Anthropic
   - **Environments**: Selecione `Production`, `Preview`, e `Development`
3. Clique em "Save"

### 3. Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (geralmente 2-3 minutos)
3. Após o sucesso, você receberá uma URL pública como `https://adaptaai.vercel.app`

## Verificação do Deploy

### Testar o Endpoint `/api/chat`

Use curl ou Postman para testar:

```bash
curl -X POST https://seu-projeto.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Olá, como você está?"
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
      "text": "Olá! Estou bem, obrigado por perguntar..."
    }
  ],
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

### Testar o Frontend

1. Acesse `https://seu-projeto.vercel.app`
2. Faça login (as credenciais estão no código original)
3. Tente usar as funcionalidades que chamam a IA (adaptações, PEI, etc.)

## Estrutura de Requisição

O frontend envia requisições no seguinte formato:

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: 'seu prompt aqui' }]
  })
});
```

**Nota importante**: O header `x-api-key` é adicionado automaticamente pelo backend serverless usando a variável de ambiente `ANTHROPIC_API_KEY`.

## Segurança

✅ **O que está seguro**:
- A chave de API da Anthropic nunca é exposta no navegador
- Todas as chamadas passam pelo backend serverless
- As variáveis de ambiente são criptografadas no Vercel

⚠️ **O que você deve fazer**:
- Nunca commite a chave de API no repositório
- Sempre use variáveis de ambiente no Vercel
- Monitore o uso da API para evitar cobranças inesperadas

## Troubleshooting

### Erro 500 no `/api/chat`

**Causa**: Variável de ambiente `ANTHROPIC_API_KEY` não configurada

**Solução**:
1. Vá para **Settings** → **Environment Variables** no Vercel
2. Verifique se `ANTHROPIC_API_KEY` está configurada
3. Redeploy o projeto

### CORS Error no Frontend

**Causa**: O frontend está tentando chamar a API da Anthropic diretamente

**Solução**: Verifique se o arquivo `client/public/index.html` tem todas as URLs atualizadas de `https://api.anthropic.com/v1/messages` para `/api/chat`

### Timeout na Requisição

**Causa**: A requisição está demorando muito

**Solução**: 
- Aumente o `max_tokens` se necessário
- Verifique a quota da API da Anthropic
- Monitore os logs no Vercel

## Monitoramento

1. Acesse o dashboard do seu projeto no Vercel
2. Vá para **Monitoring** para ver:
   - Requisições por segundo
   - Tempo de resposta
   - Erros
   - Uso de CPU e memória

## Próximos Passos

1. **Domínio Customizado**: Configure um domínio customizado em **Settings** → **Domains**
2. **Logs**: Monitore os logs em **Deployments** → **Logs**
3. **CI/CD**: Configure GitHub Actions para deployments automáticos
4. **Escalabilidade**: O Vercel escala automaticamente conforme a demanda

## Suporte

Para problemas:
- Documentação do Vercel: [vercel.com/docs](https://vercel.com/docs)
- Documentação da Anthropic: [docs.anthropic.com](https://docs.anthropic.com)
- Issues no GitHub: [github.com/marcelgantes/adaptaai/issues](https://github.com/marcelgantes/adaptaai/issues)
