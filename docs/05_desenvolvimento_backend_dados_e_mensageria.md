# Back-end: módulo de dados e mensageria
Status: PRONTO PARA VALIDAÇÃO

> Escopo deste módulo: a camada que sustenta os casos de uso CU01, CU02 e CU03 —
> banco SQLite, repositórios e o serviço MQTT de conexão única. Nenhuma tela é
> gerada aqui.

---

## 1. Contexto do módulo

Implementa quatro responsabilidades:

1. **Inicialização do banco** — criar as tabelas SQLite na primeira execução.
2. **Repositórios** — `SettingsRepository`, `ConversationRepository` e
   `MessageRepository` (CRUD sobre as três tabelas).
3. **MqttService** — uma conexão única que assina vários tópicos, publica e
   recebe mensagens, e expõe o status.
4. **Polyfill e config** — `Buffer` para o cliente MQTT e o broker padrão.

Os contratos exatos estão aprovados em `docs/04_contratos_de_api.md`. Implemente
exatamente o que está lá: sem adicionar métodos, sem alterar assinaturas.

---

## 2. Requisitos técnicos

| Item | Definição |
|---|---|
| Linguagem | TypeScript |
| Framework | React Native com Expo (managed workflow), **Expo SDK 54** (fixada na criação do projeto — ver Etapa 2 do roteiro) |
| Banco local | `expo-sqlite` (SDK 54 → ~16.x) — usar a API assíncrona (`openDatabaseAsync`, `execAsync`, `getAllAsync`, `runAsync`) |
| Cliente MQTT | pacote `mqtt` (v5); importar com `import mqtt from 'mqtt'` — a v5 roteia sozinha para o build de React Native (condição de export `react-native`). **Não** usar `mqtt/dist/mqtt.min.js` (quebra os tipos). |
| Polyfill | `import { Buffer } from 'buffer'; (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;` |
| UUID | `expo-crypto` → `Crypto.randomUUID()` |
| Reconexão | configurar `reconnectPeriod: 5000` no `mqtt.connect` (cliente reconecta sozinho) |
| Estilo de código | sem comentários óbvios; didático e direto |

**Dependências (o Agente roda no terminal):**
```bash
npx expo install expo-sqlite expo-crypto
npm install mqtt buffer
```

> **Web:** no navegador o `expo-sqlite` usa WebAssembly (`wa-sqlite`). O projeto
> precisa de um `metro.config.js` com `.wasm` em `assetExts` e headers COOP/COEP
> (criado na Etapa 2 do roteiro). No nativo (Expo Go/celular) o SQLite é nativo e
> não exige isso.

---

## 3. Contratos consumidos
Origem: `docs/04_contratos_de_api.md` (APROVADO).

| Interface / item | Arquivo a implementar |
|---|---|
| Tipos compartilhados | `src/types/index.ts` |
| Polyfill do Buffer | `src/polyfills.ts` |
| Broker padrão | `src/config.ts` |
| Inicialização do banco | `src/database/database.ts` |
| `SettingsRepository` | `src/repositories/settingsRepository.ts` |
| `ConversationRepository` | `src/repositories/conversationRepository.ts` |
| `MessageRepository` | `src/repositories/messageRepository.ts` |
| `MqttService` | `src/services/mqttService.ts` |

---

## 4. O que deve ser gerado

### 4.1 `src/polyfills.ts`
```ts
import { Buffer } from 'buffer';
(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
```
Deve ser importado **na primeira linha** do `App.tsx`, antes de qualquer import
que use `mqtt`. (Validado com `tsc`: usar `global` direto gera `TS2304`; por isso
`globalThis`.)

### 4.2 `src/config.ts`
Broker público padrão, sobrescrito pelos valores salvos em `settings` quando existirem:
```ts
export const DEFAULT_BROKER = {
  host: 'broker.hivemq.com',
  port: 8884,
  useSsl: true,
};
```

### 4.3 `src/types/index.ts`
Copiar exatamente os tipos da seção 1 do `04`.

### 4.4 `src/database/database.ts`
- Abrir o banco com `expo-sqlite` (API assíncrona) e expor uma instância única (singleton).
- Executar `PRAGMA foreign_keys = ON` **em toda abertura de conexão** (é por conexão;
  sem isso a cascata RN06 não funciona após a primeira execução — ver seção 5 do `03`).
- Na primeira abertura, checar `PRAGMA user_version`; se `0`, executar o script
  da seção 7 do `03` e setar `user_version = 1`.

### 4.5 `src/repositories/settingsRepository.ts`
Implementar `SettingsRepository` do `04`. `save` gera `client_id` (UUID) na
primeira vez e mantém o existente nas próximas. Validar campos obrigatórios (RN07).

### 4.6 `src/repositories/conversationRepository.ts`
Implementar `ConversationRepository` do `04`. `create` gera `id` e `createdAt`,
e lança `AppError TOPIC_ALREADY_EXISTS` se o tópico já existir (RN02).

### 4.7 `src/repositories/messageRepository.ts`
Implementar `MessageRepository` do `04`. `create` gera `id` e `createdAt`.

### 4.8 `src/services/mqttService.ts`
Implementar `MqttService` do `04`:
- Manter **uma só** variável de cliente (`MqttClient | null`).
- `connect`: montar URL `wss://host:port/mqtt` (ou `ws://` se `!useSsl`); criar o
  cliente com `clientId` e `reconnectPeriod: 5000`; registrar handlers `connect`,
  `reconnect`, `close`, `error` para atualizar o status; resolver a Promise no
  primeiro `connect`; rejeitar com `AppError CONNECTION_FAILED` se o primeiro
  `error` ocorrer antes de conectar.
- `subscribe` / `unsubscribe`: agir sobre o cliente existente.
- `publish`: `client.publish(topic, JSON.stringify(payload))`.
- `onMessage`: registrar callback; no evento `message`, fazer `JSON.parse` com
  try/catch e repassar `(topic, payload)`; payload inválido é ignorado.
- `getStatus` / `onStatusChange`: refletir o status interno.

---

## 5. Testes obrigatórios

### 5.1 Testes unitários — repositórios
| Caso | Verificação |
|---|---|
| `settings.save` primeira vez | Gera `clientId` e persiste os dados |
| `settings.save` segunda vez | Mantém o mesmo `clientId` |
| `settings.save` sem nickname | Lança `AppError INVALID_INPUT` |
| `conversation.create` válido | Retorna conversa com `id` e `createdAt` |
| `conversation.create` tópico repetido | Lança `AppError TOPIC_ALREADY_EXISTS` |
| `conversation.findAll` vazio | Retorna `[]` |
| `conversation.findAll` com duas | Ordenado por `created_at DESC` |
| `conversation.findByTopic` | Retorna a conversa certa ou `null` |
| `conversation.delete` | Conversa e suas mensagens somem (cascata) |
| `message.create` | Retorna mensagem com `id` e `createdAt` |
| `message.findByConversation` | Ordenado por `created_at ASC` |

### 5.2 Testes unitários — MqttService (com cliente mqtt mockado)
| Caso | Verificação |
|---|---|
| `connect` com sucesso | `getStatus` → `'connected'`; só uma conexão criada |
| `connect` com falha inicial | Rejeita com `AppError CONNECTION_FAILED` |
| `subscribe` / `unsubscribe` | Chama o método correspondente do cliente |
| `publish` | Publica o payload serializado em JSON |
| `onMessage` com payload válido | Callback recebe `(topic, payload)` desserializado |
| `onMessage` com JSON inválido | Não quebra; callback não é chamado |
| `onStatusChange` | Notifica mudança; cancelamento funciona |

### 5.3 Validação manual
1. Instalar deps e confirmar compilação (`npx tsc --noEmit` limpo e `npx expo start`).
2. Confirmar criação do banco na primeira execução.
3. Conectar ao broker padrão e confirmar status `'connected'`.

---

## 6. Critérios de aceite

| Critério | Como verificar |
|---|---|
| Testes unitários passam | Saída do runner sem falhas |
| Compila sem erro de TS | `npx tsc --noEmit` sem saída |
| Banco conforme `03` | Tabelas e índices criados |
| Uma única conexão | Inspeção do `mqttService` — sem `Map` de clientes |
| Nenhum método além do contrato | Interfaces do `04` implementadas sem adições |

---

## 7. Como usar este módulo no Copilot (Agent Mode)

> O Copilot do Codespace cria os arquivos e roda os comandos sozinho. Você só
> **revisa e aprova**. Não copie nem cole código manualmente.

**Passo 1 — Abra o Copilot Chat e selecione o modo `Agent`** no seletor de modo
(no topo do painel do chat). Crie um chat novo e renomeie para
`Agente Back-end — Dados e Mensageria`.

**Passo 2 — Cole o conteúdo de `prompts/agente_backend.md` como primeira mensagem**
(ou referencie com `#file:prompts/agente_backend.md`) para o Copilot assumir o papel.

**Passo 3 — Na mesma mensagem, anexe o contexto com `#file:`:**
```
#file:docs/00_orientacao_agentes.md
#file:docs/09_glossario_dominio.md
#file:docs/03_modelagem_banco_e_dados.md
#file:docs/04_contratos_de_api.md
#file:docs/05_desenvolvimento_backend_dados_e_mensageria.md
```

**Passo 4 — Dê a tarefa:**
```
Você está em Agent Mode. Crie os arquivos diretamente no workspace e instale as
dependências rodando os comandos no terminal. Siga estritamente os contratos do
docs/04. Implemente, nesta ordem:

1. Instale as dependências (expo-sqlite, expo-crypto, mqtt, buffer).
2. src/polyfills.ts, src/config.ts, src/types/index.ts
3. src/database/database.ts
4. src/repositories/settingsRepository.ts, conversationRepository.ts, messageRepository.ts
5. src/services/mqttService.ts
6. Os testes das seções 5.1 e 5.2.

Ao final, rode `npx tsc --noEmit` e corrija o que aparecer, sem alterar os
contratos do docs/04. Se encontrar ambiguidade, escreva [QUESTIONAMENTO] e pare.
```

**Passo 5 — Conforme o Copilot trabalha:**
- Quando ele propuser criar/editar um arquivo, revise o diff e clique **Keep**.
- Quando ele propuser um comando de terminal, leia e clique **Continue / Allow**.
- Se algo fugir do contrato, aponte no chat em vez de aceitar.

**Passo 6 — Valide pelos critérios da seção 6 e siga para o commit** (Etapa 8 do roteiro).
