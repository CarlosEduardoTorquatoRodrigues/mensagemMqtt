# Front-end: módulo renomear conversa (v1.2)
Status: PRONTO PARA VALIDAÇÃO

> Fase v1.2. Pré-requisito: a v1.1 (tela de Chat com limpar histórico) já
> implementada e aprovada. Este módulo adiciona a ação **renomear conversa**
> diretamente na tela de Conversas.

---

## 1. Contexto
Na tela de **Conversas**, o toque longo em um item já abre uma confirmação de
exclusão (RF11). Agora, antes dessa confirmação, o usuário vê um menu com duas
opções: **"Renomear"** e **"Excluir"**. Ao escolher "Renomear", um modal se abre
com o nome atual pré-preenchido; ao confirmar, o app chama
`conversationRepository.rename` e atualiza o nome na lista — sem tocar no tópico
MQTT nem no histórico.

---

## 2. Contrato consumido
Origem: `docs/04_contratos_de_api.md` (APROVADO). Usa o método novo
`ConversationRepository.rename`. Nenhum acesso direto ao banco.

---

## 3. O que deve ser gerado

| Arquivo | Alteração |
|---|---|
| `src/components/ConversationItem.tsx` | Toque longo abre um menu de ações (Alert com botões "Renomear", "Excluir" e "Cancelar") em vez de chamar exclusão diretamente. |
| `src/screens/ConversationsScreen.tsx` | Adicionar handler `handleRename(id, currentName)`: abre um `Alert.prompt` (iOS) ou um modal simples com `TextInput` (Android/web) com o nome atual pré-preenchido; ao confirmar, chama `conversationRepository.rename` e atualiza a lista. |

Nenhuma outra tela ou componente muda. Estilização com `StyleSheet`.

> **Nota de plataforma:** `Alert.prompt` só existe no iOS nativo. Para
> Android e web, usar um modal com `TextInput` e botões "Confirmar" / "Cancelar",
> estilizado com `StyleSheet`. O Agente deve implementar a solução compatível com
> as três plataformas (iOS, Android, web).

---

## 4. Experiência esperada
- Toque longo em uma conversa abre um menu: **"Renomear"**, **"Excluir"** e
  **"Cancelar"**.
- Ao tocar "Renomear": um campo de texto aparece com o nome atual pré-preenchido.
- Ao confirmar com nome válido: a lista atualiza imediatamente com o novo nome; o
  tópico e as mensagens permanecem intactos.
- Ao confirmar com nome vazio: o app mostra aviso "O nome não pode ser vazio." e
  não chama o repositório.
- Ao cancelar: nada muda.
- O fluxo de exclusão (toque longo → "Excluir" → confirmação) continua funcionando
  exatamente como antes.

---

## 5. Testes obrigatórios

### 5.1 Testes de comportamento
| Caso | Verificação |
|---|---|
| Toque longo abre menu com "Renomear" e "Excluir" | Ambas as opções estão visíveis |
| Confirmar renomeação válida | Nome atualiza na lista; tópico preservado |
| Confirmar nome vazio | Aviso exibido; lista não muda |
| Cancelar renomeação | Lista não muda |
| Fluxo de exclusão preservado | Toque longo → "Excluir" ainda remove a conversa |

### 5.2 Validação manual
1. Toque longo em uma conversa — confirmar que aparecem "Renomear", "Excluir" e "Cancelar".
2. Tocar "Renomear", apagar o nome e confirmar vazio — ver o aviso.
3. Tocar "Renomear", digitar um novo nome e confirmar — ver o nome atualizar na lista.
4. Abrir a conversa renomeada e confirmar que as mensagens anteriores continuam lá.
5. Toque longo → "Excluir" — confirmar que ainda funciona normalmente.

---

## 6. Critérios de aceite
| Critério | Como verificar |
|---|---|
| Menu de ações no toque longo | "Renomear", "Excluir" e "Cancelar" visíveis |
| Nome atualiza ao confirmar | Lista reflete o novo nome imediatamente |
| Nome vazio bloqueado com aviso | Mensagem de erro visível; lista intacta |
| Cancelar não altera nada | Lista intacta |
| Tópico e mensagens preservados | Abrir a conversa renomeada mostra o histórico anterior |
| Fluxo de exclusão intacto | RF11 continua funcionando |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Sem acesso direto ao banco | Usa `rename` do repositório |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

**Passo 1 — Copilot Chat em modo `Agent`.** Chat novo: `Agente Front-end — Renomear Conversa (v1.2)`.

**Passo 2 — Cole `prompts/agente_frontend.md`**.

**Passo 3 — Anexe o contexto:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_renomear_conversa.md
```

**Passo 4 — Tarefa:**
```
Você está em Agent Mode. Modifique src/components/ConversationItem.tsx e
src/screens/ConversationsScreen.tsx para adicionar a ação "Renomear conversa"
conforme o docs/06_desenvolvimento_frontend_renomear_conversa. Use StyleSheet;
não acesse o banco diretamente; não altere outras telas. Implemente o modal de
renomeação compatível com iOS, Android e web. Gere os testes da seção 5.1. Ao
final, rode `npx tsc --noEmit` e corrija o que aparecer sem mudar o contrato.
Se houver ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Aprove os diffs (Keep). Veja rodando:** `npx expo start`, tecla `w`.
Faça toque longo em uma conversa e valide pela seção 6.
