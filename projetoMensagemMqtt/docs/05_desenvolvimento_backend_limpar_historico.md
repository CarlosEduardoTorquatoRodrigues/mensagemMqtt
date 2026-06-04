# Back-end: módulo limpar histórico (v1.1)
Status: PRONTO PARA VALIDAÇÃO

> Fase v1.1. Pré-requisito: a v1.0 (módulo de dados e mensageria) já implementada
> e aprovada. Este módulo adiciona **uma única operação** à camada de dados:
> apagar todas as mensagens de uma conversa, sem excluir a conversa.

---

## 1. Contexto do módulo
Implementa o requisito RF12 / regra RN10: limpar o histórico de uma conversa.
A conversa e a assinatura do seu tópico continuam ativas; apenas as mensagens
são removidas.

É uma extensão pequena do `MessageRepository` já existente. Nenhum outro arquivo
de back-end muda.

---

## 2. Requisitos técnicos
Os mesmos da v1.0 (ver `05_desenvolvimento_backend_dados_e_mensageria.md`).
Nenhuma dependência nova.

---

## 3. Contrato consumido
Origem: `docs/04_contratos_de_api.md` (APROVADO). Método adicionado ao
`MessageRepository`:

```ts
// (v1.1) Apaga todas as mensagens da conversa, mantendo a conversa. RN10.
deleteByConversation(conversationId: string): Promise<void>;
```

---

## 4. O que deve ser gerado

### 4.1 `src/repositories/messageRepository.ts` (alteração)
Adicionar a implementação de `deleteByConversation`:
- Executar `DELETE FROM messages WHERE conversation_id = ?`.
- Não tocar na tabela `conversations`.
- Não lançar erro se a conversa não tiver mensagens (operação idempotente).

Nenhum outro método é alterado.

---

## 5. Testes obrigatórios

### 5.1 Testes unitários — MessageRepository (v1.1)
| Caso | Verificação |
|---|---|
| `deleteByConversation` com mensagens | `findByConversation` passa a retornar `[]` |
| A conversa permanece | `conversationRepository.findById` ainda retorna a conversa |
| Não afeta outras conversas | Mensagens de outra conversa continuam intactas |
| `deleteByConversation` sem mensagens | Não lança erro (idempotente) |

### 5.2 Validação manual
1. Em uma conversa com mensagens, chamar a operação e confirmar que `findByConversation` fica vazio.
2. Confirmar que a conversa ainda aparece na lista (`findAll`).

---

## 6. Critérios de aceite
| Critério | Como verificar |
|---|---|
| Testes unitários passam | Saída do runner sem falhas |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Conversa preservada | Conversa continua em `findAll` após limpar |
| Apenas o método novo foi adicionado | Diff do `messageRepository.ts` só inclui `deleteByConversation` |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

> O Copilot edita o arquivo e roda os testes. Você revisa e aprova.

**Passo 1 — Copilot Chat em modo `Agent`.** Chat novo: `Agente Back-end — Limpar Histórico (v1.1)`.

**Passo 2 — Cole `prompts/agente_backend.md`** (ou `#file:prompts/agente_backend.md`).

**Passo 3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_limpar_historico.md
```

**Passo 4 — Tarefa:**
```
Você está em Agent Mode. Adicione APENAS o método deleteByConversation ao
src/repositories/messageRepository.ts, conforme o docs/04, sem alterar os demais
métodos. Gere os testes da seção 5.1. Ao final, rode `npx tsc --noEmit` e os
testes, e corrija o que aparecer sem mudar o contrato. Se houver ambiguidade,
escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Aprove o diff (Keep) e os comandos (Continue). Valide pela seção 6.**
