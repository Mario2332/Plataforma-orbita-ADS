# Backup do Sistema de Notificações

Este diretório contém o backup completo do sistema de notificações que foi removido temporariamente da plataforma.

## Arquivos Incluídos

### Frontend (React)
- **Notificacoes.tsx** - Componente React que exibe o ícone de sino na barra lateral com dropdown de notificações

### Backend (Firebase Functions)
- **notificacoes.ts** - Funções callable para gerenciar notificações (criar, listar, marcar como lida, deletar)
- **metaNotificacoes.ts** - Helper que verifica e cria notificações de progresso e conclusão de metas

## Como Reimplementar

### 1. Restaurar o Componente Frontend

1. Copie `Notificacoes.tsx` para `client/src/components/`
2. No arquivo `client/src/components/DashboardLayout.tsx`, adicione:
   ```tsx
   import Notificacoes from './Notificacoes';
   ```
3. Adicione o componente `<Notificacoes />` na barra lateral (SidebarHeader)

### 2. Restaurar as Funções Backend

1. Copie `notificacoes.ts` para `functions/src/callable/`
2. Copie `metaNotificacoes.ts` para `functions/src/helpers/`
3. No arquivo `functions/src/index.ts`, adicione:
   ```ts
   export { notificacoesFunctions } from "./callable/notificacoes";
   ```

### 3. Restaurar Chamadas de Notificação

No arquivo `functions/src/callable/metas.ts`, adicione:
```ts
import { criarNotificacao } from "./notificacoes";
```

E chame `criarNotificacao()` quando uma meta for criada.

No arquivo `functions/src/triggers/updateMetasProgress.ts`, adicione:
```ts
import { verificarECriarNotificacoesMeta } from "../helpers/metaNotificacoes";
```

E chame `verificarECriarNotificacoesMeta()` quando o progresso de uma meta for atualizado.

### 4. Deploy

```bash
npm run build
firebase deploy --only hosting,functions
```

## Estrutura de Dados no Firestore

As notificações são armazenadas em:
```
alunos/{alunoId}/notificacoes/{notificacaoId}
```

Campos:
- `tipo`: string (meta_concluida, meta_criada, progresso_25, progresso_50, progresso_75, etc.)
- `titulo`: string
- `mensagem`: string
- `lida`: boolean
- `metaId`: string (opcional)
- `metaNome`: string (opcional)
- `createdAt`: Timestamp

## Tipos de Notificações

| Tipo | Emoji | Descrição |
|------|-------|-----------|
| meta_criada | ⭐ | Meta foi criada |
| meta_concluida | 🎉 | Meta foi concluída |
| progresso_25 | 📈 | 25% da meta atingido |
| progresso_50 | 🎯 | 50% da meta atingido |
| progresso_75 | 🚀 | 75% da meta atingido |
| meta_expirada | ⚠️ | Meta expirou |
| meta_proxima_expirar | ⏰ | Meta próxima de expirar |
| sequencia_mantida | 🔥 | Sequência de estudos mantida |

## Data do Backup

- **Data:** 24 de dezembro de 2024
- **Motivo:** Reimplementação futura do sistema de notificações
