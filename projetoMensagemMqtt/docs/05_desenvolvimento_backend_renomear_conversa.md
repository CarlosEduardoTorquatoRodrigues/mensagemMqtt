# Back-end: módulo renomear conversa (v1.2)
Status: PRONTO PARA VALIDAÇÃO

> Fase v1.2. Pré-requisito: a v1.1 (módulo limpar histórico) já implementada e
> aprovada. Este módulo adiciona **uma única operação** à camada de dados:
> renomear uma conversa, alterando apenas seu nome de exibição.

---

## 1. Contexto do módulo
Implementa o requisito RF13 / regra RN12: renomear uma conversa.
Apenas o campo `name` da conversa é alterado. O tópico MQTT, o histórico de
mensagens e a assinatura do tópico permanecem intactos.

É uma extensão pequena do `ConversationRepository` já existente. Nenhum outro
arquivo de back-end muda.

---

## 2. Requisitos técnicos
Os mesmos da v1.0 (ver `05_desenvolvimento_backend_dados_e_mensageria.md`).
Nenhuma dependência nova.

---

## 3. Contrato consumido
Origem: `docs/04_contratos_de_api.md` (a ser atualizado). Método adicionado ao
`ConversationRepository`:

```ts
// (v1.2) Renomeia a conversa, alterando apenas o campo name. RN12.
rename(id: string, name: string): Promise<Conversation>;
```

---

## 4. O que deve ser gerado

### 4.1 `src/repositories/conversationRepository.ts` (alteração)
Adicionar a implementação de `rename`:
- Executar `UPDATE conversations SET name = ? WHERE id = ?`.
- Lançar `AppError INVALID_INPUT` se `name` for vazio ou composto só por espaços.
- Lançar `AppError INVALID_INPUT` se a conversa com o `id` fornecido não existir.
- Retornar a conversa atualizada (via `findById` após o UPDATE).
- Não tocar no campo `topic`, nas mensagens nem na assinatura MQTT.

Nenhum outro método é alterado.

---

## 5. Testes obrigatórios

### 5.1 Testes unitários — ConversationRepository (v1.2)
| Caso | Verificação |
|---|---|
| `rename` com nome válido | Retorna a conversa com o novo `name`; `topic` permanece igual |
| `rename` com nome vazio | Lança `AppError INVALID_INPUT` |
| `rename` com nome só espaços | Lança `AppError INVALID_INPUT` |
| `rename` com `id` inexistente | Lança `AppError INVALID_INPUT` |
| Mensagens preservadas | `messageRepository.findByConversation` continua retornando as mensagens |

### 5.2 Validação manual
1. Renomear uma conversa e confirmar que o novo nome aparece em `findAll`.
2. Confirmar que o tópico não mudou e que as mensagens continuam intactas.

---

## 6. Critérios de aceite
| Critério | Como verificar |
|---|---|
| Testes unitários passam | Saída do runner sem falhas |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Tópico preservado | `findById` após rename: `topic` igual ao original |
| Mensagens preservadas | `findByConversation` retorna as mensagens anteriores |
| Apenas o método novo foi adicionado | Diff do `conversationRepository.ts` só inclui `rename` |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

**Passo 1 — Copilot Chat em modo `Agent`.** Chat novo: `Agente Back-end — Renomear Conversa (v1.2)`.

**Passo 2 — Cole `prompts/agente_backend.md`** (ou `#file:prompts/agente_backend.md`).

**Passo 3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_renomear_conversa.md
```

**Passo 4 — Tarefa:**
```
Você está em Agent Mode. Adicione APENAS o método rename ao
src/repositories/conversationRepository.ts, conforme o docs/04, sem alterar os
demais métodos. Gere os testes da seção 5.1. Ao final, rode `npx tsc --noEmit`
e os testes, e corrija o que aparecer sem mudar o contrato. Se houver
ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Aprove o diff (Keep) e os comandos (Continue). Valide pela seção 6.**
