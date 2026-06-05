# Roteiro do aluno — fase v1.2: renomear conversa

> **Pré-requisito:** você já concluiu a v1.1 (limpar histórico) seguindo o
> `roteiro_alunos_v1.1.md`. Esta é uma prática **curta**, feita no **mesmo
> Codespace/repositório**.

## O que você vai adicionar

A ação **"Renomear"** no toque longo de uma conversa: o usuário troca o nome de
exibição da conversa **sem alterar o tópico MQTT nem o histórico de mensagens**.
A conversa continua funcionando normalmente — só o nome muda.

Lembrete: você continua em **Agent Mode**. O Copilot edita os arquivos e roda os
comandos; você revisa o diff (**Keep**) e autoriza os comandos (**Continue**).

## Visão geral das etapas

| Etapa | Nome | Quem faz |
|---|---|---|
| 1 | Abrir o Codespace do projeto | Você |
| 2 | Atualizar o contrato de API | Você (edição manual ou Copilot) |
| 3 | Back-end: novo método no repositório | Agente Back-end |
| 4 | Front-end: ação de renomear na lista | Agente Front-end |
| 5 | Validar com QA | Agente QA |
| 6 | Registrar no log | Agente Documentador |
| 7 | Fazer commit | Você + Copilot |

---

## Etapa 1 — Abrir o Codespace

Abra o mesmo Codespace usado na v1.1. Os arquivos da v1.1 (`src/`, `App.tsx`)
já devem estar lá.

---

## Etapa 2 — Atualizar o contrato de API

> **Onde:** editor de arquivos (ou Copilot em modo normal)

Abra `docs/04_contratos_de_api.md` e adicione o método abaixo à interface
`ConversationRepository` (seção 3 do arquivo), logo após o método `delete`:

```ts
// (v1.2) Renomeia a conversa, alterando apenas o campo name. RN12.
// Lança AppError INVALID_INPUT se name for vazio/só espaços ou se id não existir.
rename(id: string, name: string): Promise<Conversation>;
```

Salve o arquivo. Este é o único arquivo de documentação que você edita
manualmente nesta fase — os demais são gerados pelos agentes.

> **Checkpoint:** `docs/04_contratos_de_api.md` contém o método `rename` na
> interface `ConversationRepository`.

---

## Etapa 3 — Back-end: método `rename`

> **Onde:** CHAT (modo Agent)

**3.1 — Chat novo**, renomeado para `Agente Back-end — Renomear Conversa (v1.2)`.

**3.2 — Cole `prompts/agente_backend.md`** e anexe o contexto:
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_renomear_conversa.md
```

**3.3 — Tarefa:**
```
Você está em Agent Mode. Adicione APENAS o método rename ao
src/repositories/conversationRepository.ts, conforme o docs/04, sem alterar os
demais métodos. Gere os testes da seção 5.1 do
docs/05_desenvolvimento_backend_renomear_conversa. Ao final, rode
`npx tsc --noEmit` e os testes, e corrija o que aparecer sem mudar o contrato.
Se houver ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**3.4 — Aprove o diff (Keep) e os comandos (Continue).**

> **Checkpoint:** método adicionado, `npx tsc --noEmit` sem erro, testes passando.

---

## Etapa 4 — Front-end: ação de renomear na lista

> **Onde:** CHAT (modo Agent)

**4.1 — Chat novo**, renomeado para `Agente Front-end — Renomear Conversa (v1.2)`.

**4.2 — Cole `prompts/agente_frontend.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_renomear_conversa.md
```

**4.3 — Tarefa:**
```
Você está em Agent Mode. Modifique src/components/ConversationItem.tsx e
src/screens/ConversationsScreen.tsx para adicionar a ação "Renomear conversa"
conforme o docs/06_desenvolvimento_frontend_renomear_conversa. Use StyleSheet;
não acesse o banco diretamente; não altere outras telas. Implemente o modal de
renomeação compatível com iOS, Android e web. Gere os testes da seção 5.1. Ao
final, rode `npx tsc --noEmit` e corrija o que aparecer sem mudar o contrato.
Se houver ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**4.4 — Aprove os diffs (Keep). Veja rodando:** `npx expo start`, tecla `w`.
Faça toque longo em uma conversa e valide pela seção 6 do doc de front-end.

> **Checkpoint:** menu aparece no toque longo; renomear atualiza a lista;
> tópico e mensagens preservados; sem erro de TS.

---

## Etapa 5 — Validar com QA

> **Onde:** CHAT (modo Agent)

**5.1 — Chat novo**, `Agente QA — Renomear Conversa (v1.2)`.

**5.2 — Cole `prompts/agente_qa.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/02_requisitos_e_regras_de_negocio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_renomear_conversa.md
#file:docs/06_desenvolvimento_frontend_renomear_conversa.md
#file:docs/07_plano_de_testes.md
```

**5.3 — Tarefa:**
```
Você está em Agent Mode (só leitura e execução de testes). Execute os testes
v1.2 (seções 5.1 dos docs de back-end e front-end), confirmando RF13/RN12: o
nome da conversa muda, o tópico e as mensagens permanecem intactos, e o fluxo
de exclusão continua funcionando. Para cada falha: ID, severidade e reprodução.
Recomende aprovação ou rejeição e atualize o docs/07.
```

Se houver falha, leve ao agente responsável (Etapa 3 ou 4) e peça correção,
depois revalide.

---

## Etapa 6 — Registrar no log

> **Onde:** CHAT (modo Agent)

**6.1 — Chat novo**, `Agente Documentador — v1.2`.

**6.2 — Cole `prompts/agente_documentador.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/08_log_de_evolucao.md
```

**6.3 — Tarefa:**
```
Você está em Agent Mode. Atualize o docs/08_log_de_evolucao.md fechando a fase
v1.2 (renomear conversa): marque os módulos de back-end e front-end da v1.2 como
implementados/testados, com o resultado real do QA, data de hoje e validador
[seu nome]. Edite o arquivo e me mostre o diff.
```

---

## Etapa 7 — Fazer commit

> **Onde:** CHAT ou TERMINAL

Peça ao Copilot:
```
Em Agent Mode, faça commit das mudanças da v1.2 com a mensagem:

[backend][frontend] feat: renomear conversa (v1.2)

rename no conversationRepository e ação "Renomear" no toque longo da lista de
conversas. Tópico e histórico preservados. Testes passando. QA: aprovado.
Validação humana: [seu nome].
Referência: docs/08_log_de_evolucao.md.

Depois rode `git push`.
```

> **Checkpoint final:**
> - [ ] `git push` concluído
> - [ ] App: renomear conversa funciona; tópico e mensagens preservados
> - [ ] Fluxo de exclusão continua funcionando

---

## Erros comuns

| Erro | O que fazer |
|---|---|
| Copilot alterou o tópico junto com o nome | "RN12: rename altera apenas o campo name. O topic é imutável." |
| Copilot acessou o banco direto na tela | "Use conversationRepository.rename do docs/04, não SQL na tela." |
| `Alert.prompt` não funciona no Android/web | "Implemente um modal com TextInput e StyleSheet compatível com as três plataformas." |
| Erro de TypeScript | "Corrija este erro sem alterar o docs/04." |
| Fluxo de exclusão parou de funcionar | "O toque longo agora abre um menu; o fluxo de exclusão deve continuar via opção 'Excluir' nesse menu." |
