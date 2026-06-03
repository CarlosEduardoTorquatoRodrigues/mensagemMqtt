# Front-end: módulo limpar histórico (v1.1)
Status: PRONTO PARA VALIDAÇÃO

> Fase v1.1. Pré-requisito: a v1.0 (telas de Conversas e Chat) já implementada e
> aprovada. Este módulo adiciona uma ação de **limpar histórico** na tela de Chat.

---

## 1. Contexto
Na tela de **Chat**, o usuário ganha uma ação "Limpar histórico". Ao confirmar,
o app apaga todas as mensagens daquela conversa (via `MessageRepository.
deleteByConversation`) e a lista de mensagens fica vazia — mas a conversa
continua na lista e segue recebendo novas mensagens (a assinatura do tópico não
é tocada — RN10).

---

## 2. Contrato consumido
Origem: `docs/04_contratos_de_api.md` (APROVADO). Usa o método novo
`MessageRepository.deleteByConversation`. Nenhum acesso direto ao banco.

---

## 3. O que deve ser gerado

| Arquivo | Alteração |
|---|---|
| `src/screens/ChatScreen.tsx` | Adicionar uma ação "Limpar histórico" (ícone/botão no topo da tela). Ao tocar, abrir confirmação; ao confirmar, chamar `deleteByConversation`, esvaziar a lista de mensagens em tela e fechar o diálogo. |

Nenhuma outra tela ou componente muda. Estilização com `StyleSheet`.

---

## 4. Experiência esperada
- A ação "Limpar histórico" fica visível na tela de Chat (ex.: ícone de lixeira
  no cabeçalho, distinto da exclusão da conversa, que fica na lista).
- Tocar mostra confirmação: *"Apagar todas as mensagens desta conversa? A conversa
  será mantida."*
- Ao confirmar: a lista de mensagens fica vazia imediatamente; a conversa
  permanece aberta e pode receber/enviar novas mensagens normalmente.
- Ao cancelar: nada muda.

---

## 5. Testes obrigatórios

### 5.1 Testes de comportamento
| Caso | Verificação |
|---|---|
| Confirmar limpeza | A lista de mensagens fica vazia após confirmar |
| Cancelar limpeza | As mensagens permanecem |
| Conversa preservada | Após limpar, a conversa ainda existe e aceita nova mensagem |

### 5.2 Validação manual
1. Abrir uma conversa com mensagens, tocar "Limpar histórico" e confirmar.
2. Ver a tela esvaziar e a conversa continuar na lista.
3. Enviar uma nova mensagem e confirmar que ela aparece normalmente.

---

## 6. Critérios de aceite
| Critério | Como verificar |
|---|---|
| Histórico esvazia ao confirmar | Lista de mensagens vazia |
| Cancelar não altera nada | Mensagens intactas |
| Conversa e tópico preservados | Conversa na lista; novas mensagens chegam |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Sem acesso direto ao banco | Usa `deleteByConversation` do repositório |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

**Passo 1 — Copilot Chat em modo `Agent`.** Chat novo: `Agente Front-end — Limpar Histórico (v1.1)`.

**Passo 2 — Cole `prompts/agente_frontend.md`.**

**Passo 3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_limpar_historico.md
```

**Passo 4 — Tarefa:**
```
Você está em Agent Mode. Adicione a ação "Limpar histórico" ao
src/screens/ChatScreen.tsx, com confirmação, usando
MessageRepository.deleteByConversation do docs/04. Use StyleSheet; não acesse o
banco diretamente; não altere outras telas. Gere os testes da seção 5.1. Ao
final, rode `npx tsc --noEmit` e corrija o que aparecer sem mudar o contrato.
Se houver ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Aprove o diff (Keep), rode o app e valide pela seção 6.**
