# MensagemMQTT — material didático com IA multiagente

Material didático para a disciplina de **desenvolvimento mobile**. Os alunos
constroem um app real de mensagens — com **múltiplas conversas em tempo real** —
conduzindo a **IA multiagente do GitHub Copilot** dentro do GitHub Codespaces.

O aluno não decide arquitetura nem escreve código à mão: toda a especificação já
está pronta em `docs/`, e o Copilot (em **Agent Mode**) gera o código e roda os
comandos. O aluno orienta os agentes e aprova o que eles fazem.

## Por onde começar

- **Aluno:** abra o `roteiro_alunos.md` e siga a partir da **Etapa 1** (você recebe
  este projeto como `.zip` no Portal UNIPAM e o traz para dentro do seu Codespace).
- **Professor:** leia o `guia_professor-v2.md` (inclui como preparar/distribuir o
  `.zip`, como conduzir a prática e o que os alunos entregam).

## Como funciona o método

Cada parte do app tem um **agente especialista**: Arquiteto, Designer de API,
Back-end, Front-end, QA e Documentador. Em cada etapa você:

1. Abre um chat novo no Copilot em **Agent Mode**.
2. Cola a persona do agente (de `prompts/`) e aponta os documentos de `docs/` com `#file:`.
3. Dá a tarefa — o **Copilot cria os arquivos e executa os comandos**.
4. Você **revisa o diff (Keep)** e **autoriza os comandos (Continue)**.

O handoff entre agentes acontece sempre pelos arquivos do repositório, com
validação humana entre as etapas.

## O app

Um mensageiro com várias conversas. Cada conversa é um **tópico MQTT**; quem
assina o mesmo tópico troca mensagens em tempo real. O histórico fica salvo
localmente no celular.

**Tecnologias:** React Native + Expo (**SDK 54**, mobile) · SQLite (`expo-sqlite`) ·
MQTT sobre WebSocket (pacote `mqtt`) · uma única conexão assinando vários tópicos.

## Estrutura do repositório

```
README.md                        esta página
CLAUDE.md                        regras persistentes do projeto
.devcontainer/devcontainer.json  fixa o Codespace em Node 20 + Copilot
.github/copilot-instructions.md  instruções automáticas do Copilot
docs/                            especificações 00 a 09 (visão, requisitos,
                                 modelagem, contratos, módulos, testes, log, glossário)
prompts/                         personas dos 6 agentes
guia_professor.md                guia do professor
roteiro_alunos.md                passo a passo do aluno (v1.0)
roteiro_alunos_v1.1.md           passo a passo do aluno (v1.1 — limpar histórico)
                                 (src/, App.tsx, package.json… são gerados na prática)
```

## Pré-requisitos

- Conta no GitHub com **Student Developer Pack** e **Copilot habilitado** (com **Agent Mode**).
- **Node 20+** — já garantido pelo `.devcontainer` do repositório (o Codespace abre em Node 20).
- Conta gratuita no **Expo** ([expo.dev](https://expo.dev)) — apenas para o build final no celular.

## Fases do projeto

- **v1.0:** Ajustes (perfil + broker), Conversas (criar e excluir), Chat em tempo
  real e histórico local. → `roteiro_alunos.md`
- **v1.1:** Limpar o histórico de uma conversa sem excluí-la. → `roteiro_alunos_v1.1.md`
- **Próximas ideias:** ver a seção 9 do `guia_professor.md`.
