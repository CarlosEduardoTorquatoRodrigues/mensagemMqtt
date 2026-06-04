# Roteiro do aluno — fase v1.1: limpar histórico

> **Pré-requisito:** você já concluiu a v1.0 (o app de Conversas e Chat
> funcionando) seguindo o `roteiro_alunos.md`. Esta é uma prática **curta**, feita
> no **mesmo Codespace/repositório**.

## O que você vai adicionar

Uma ação **"Limpar histórico"** na tela de Chat: ela apaga todas as mensagens da
conversa **sem excluir a conversa**. A conversa continua na lista e segue
recebendo mensagens — só o histórico antigo é apagado.

Lembrete: você continua em **Agent Mode**. O Copilot edita os arquivos e roda os
comandos; você revisa o diff (**Keep**) e autoriza os comandos (**Continue**).

## Visão geral das etapas

| Etapa | Nome | Quem faz |
|---|---|---|
| 1 | Abrir o Codespace do projeto | Você |
| 2 | Back-end: novo método no repositório | Agente Back-end |
| 3 | Front-end: ação na tela de Chat | Agente Front-end |
| 4 | Validar com QA | Agente QA |
| 5 | Registrar no log | Agente Documentador |
| 6 | Fazer commit | Você + Copilot |

---

## Etapa 1 — Abrir o Codespace

Abra o mesmo Codespace usado na v1.0 (ou crie um novo no mesmo repositório). Os
arquivos da v1.0 (`src/`, `App.tsx`) já devem estar lá.

---

## Etapa 2 — Back-end: método `deleteByConversation`

> **Onde:** CHAT (modo Agent)

**2.1 — Chat novo**, renomeado para `Agente Back-end — Limpar Histórico (v1.1)`.

**2.2 — Cole `prompts/agente_backend.md`** e anexe o contexto:
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_limpar_historico.md
```

**2.3 — Tarefa:**
```
Você está em Agent Mode. Adicione APENAS o método deleteByConversation ao
src/repositories/messageRepository.ts, conforme o docs/04, sem alterar os demais
métodos. Gere os testes da seção 5.1 do docs/05_desenvolvimento_backend_limpar_historico.
Ao final, rode `npx tsc --noEmit` e os testes, e corrija o que aparecer sem mudar
o contrato. Se houver ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**2.4 — Aprove o diff (Keep) e os comandos (Continue).**

> **Checkpoint:** método adicionado, `npx tsc --noEmit` sem erro, teste passando.

---

## Etapa 3 — Front-end: ação na tela de Chat

> **Onde:** CHAT (modo Agent)

**3.1 — Chat novo**, renomeado para `Agente Front-end — Limpar Histórico (v1.1)`.

**3.2 — Cole `prompts/agente_frontend.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/04_contratos_de_api.md
#file:docs/06_desenvolvimento_frontend_limpar_historico.md
```

**3.3 — Tarefa:**
```
Você está em Agent Mode. Adicione a ação "Limpar histórico" ao
src/screens/ChatScreen.tsx, com confirmação, usando
MessageRepository.deleteByConversation do docs/04. Use StyleSheet; não acesse o
banco diretamente; não altere outras telas. Gere os testes da seção 5.1 do
docs/06_desenvolvimento_frontend_limpar_historico. Ao final, rode `npx tsc --noEmit`
e corrija o que aparecer sem mudar o contrato. Se houver ambiguidade, escreva
[QUESTIONAMENTO] e pare.
```

**3.4 — Aprove o diff (Keep). Veja rodando:** peça `npx expo start`, tecla `w`.
Abra uma conversa com mensagens, toque "Limpar histórico", confirme e veja a
lista esvaziar — a conversa continua na lista.

> **Checkpoint:** histórico esvazia ao confirmar; conversa preservada; sem erro de TS.

---

## Etapa 4 — Validar com QA

> **Onde:** CHAT (modo Agent)

**4.1 — Chat novo**, `Agente QA — Limpar Histórico (v1.1)`.

**4.2 — Cole `prompts/agente_qa.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/02_requisitos_e_regras_de_negocio.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_limpar_historico.md
#file:docs/06_desenvolvimento_frontend_limpar_historico.md
#file:docs/07_plano_de_testes.md
```

**4.3 — Tarefa:**
```
Você está em Agent Mode (só leitura e execução de testes). Execute os testes
v1.1 do docs/07 (seções 2.3 e 3.4), confirmando RF12/RN10: o histórico esvazia,
a conversa permanece e o tópico continua assinado. Para cada falha: ID,
severidade e reprodução. Recomende aprovação ou rejeição e atualize o docs/07.
```

Se houver falha, leve ao agente responsável (Etapa 2 ou 3) e peça correção,
depois revalide.

---

## Etapa 5 — Registrar no log

> **Onde:** CHAT (modo Agent)

**5.1 — Chat novo**, `Agente Documentador — v1.1`.

**5.2 — Cole `prompts/agente_documentador.md`** e anexe:
```
#file:docs/00_orientacao_agentes.md
#file:docs/08_log_de_evolucao.md
```

**5.3 — Tarefa:**
```
Você está em Agent Mode. Atualize o docs/08_log_de_evolucao.md fechando a fase
v1.1 (limpar histórico): marque os módulos de back-end e front-end da v1.1 como
implementados/testados, com o resultado real do QA, data de hoje e validador
[seu nome]. Edite o arquivo e me mostre o diff.
```

---

## Etapa 6 — Fazer commit

> **Onde:** CHAT ou TERMINAL

Peça ao Copilot:
```
Em Agent Mode, faça commit das mudanças da v1.1 com a mensagem:

[backend][frontend] feat: limpar histórico de conversa (v1.1)

deleteByConversation no messageRepository e ação "Limpar histórico" na tela de
Chat. Testes passando. QA: aprovado.
Validação humana: [seu nome].
Referência: docs/08_log_de_evolucao.md.

Depois rode `git push`.
```

> **Checkpoint final:**
> - [ ] `git push` concluído
> - [ ] App: limpar histórico funciona e a conversa é preservada

---

## Erros comuns

| Erro | O que fazer |
|---|---|
| Copilot apagou a conversa junto | "RN10: limpar histórico mantém a conversa e a assinatura. Apague só as mensagens." |
| Copilot acessou o banco direto na tela | "Use MessageRepository.deleteByConversation do docs/04, não SQL na tela." |
| Erro de TypeScript | "Corrija este erro sem alterar o docs/04." |
