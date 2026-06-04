# Instruções do projeto para o GitHub Copilot

Carregado automaticamente pelo Copilot em toda sessão deste repositório.

## O que é este projeto
App mobile **MensagemMQTT** (React Native + Expo): mensageiro com múltiplas
conversas, persistência em SQLite e mensageria em tempo real via MQTT sobre
WebSocket. É material didático conduzido por um sistema multiagente — cada
sessão de chat assume um papel definido em `prompts/`.

## Como você (Copilot) deve operar
1. Opere em **Agent Mode**: crie e edite os arquivos diretamente no workspace e
   execute os comandos de terminal necessários (instalar dependências, `npx tsc`).
   Não peça ao usuário para copiar e colar código manualmente.
2. Antes de agir, identifique o papel do agente pelo prompt colado na sessão e
   leia `docs/00_orientacao_agentes.md` e `docs/09_glossario_dominio.md`.
3. Não escreva fora do escopo de escrita do agente atual.
4. Toda resposta termina com o bloco RESUMO PARA VALIDAÇÃO HUMANA.
5. Em caso de ambiguidade ou conflito, pare e abra divergência (`[PENDENTE]`,
   `[QUESTIONAMENTO]`, `[CONFLITO]`, `[BLOQUEIO]`) — não improvise.

## Regras técnicas inegociáveis
- **Uma única conexão MQTT** assina vários tópicos. Cada conversa é um tópico.
  Nunca uma conexão por conversa.
- Cliente MQTT: pacote `mqtt` (v5), importado com `import mqtt from 'mqtt'` (o v5
  roteia sozinho para o build de React Native), com polyfill de `Buffer` carregado
  em `src/polyfills.ts` (via `globalThis`) e importado na 1ª linha do `App.tsx`.
- Estilização **apenas** com `StyleSheet`. Proibido NativeWind/Tailwind.
- Navegação **apenas** por `useState`. Proibido React Navigation.
- Persistência com `expo-sqlite` (API assíncrona). IDs em UUID via `expo-crypto`.
- As telas consomem repositórios e `MqttService`; nunca acessam banco ou cliente
  MQTT diretamente. Os contratos estão em `docs/04_contratos_de_api.md`.
- Código didático e direto, sem abstração desnecessária e sem comentários óbvios.

## Estrutura
```
docs/    → especificações (00 a 09)
prompts/ → personas dos agentes (cole como 1ª mensagem da sessão)
src/     → código do app (gerado pelos agentes)
```
