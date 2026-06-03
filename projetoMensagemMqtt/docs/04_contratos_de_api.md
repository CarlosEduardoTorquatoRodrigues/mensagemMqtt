# Contratos de API
Status: APROVADO

> Este app é totalmente local: não há API REST. Os "contratos" são as
> **interfaces TypeScript** que separam as camadas (banco → repositórios →
> serviço MQTT → telas). O front-end e o back-end consomem estas interfaces
> como verdade absoluta. Nenhuma camada adiciona métodos fora do que está aqui.

## 1. Tipos compartilhados — `src/types/index.ts`

```ts
export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';

export type MessageDirection = 'sent' | 'received';

export interface Settings {
  nickname: string;
  brokerHost: string;
  brokerPort: number;
  useSsl: boolean;
  clientId: string;
}

export type UpdateSettingsInput = Partial<
  Omit<Settings, 'clientId'>
>;

export interface Conversation {
  id: string;
  name: string;
  topic: string;
  createdAt: string; // ISO 8601
}

export interface CreateConversationInput {
  name: string;
  topic: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  body: string;
  direction: MessageDirection;
  createdAt: string; // ISO 8601
}

export interface CreateMessageInput {
  conversationId: string;
  sender: string;
  body: string;
  direction: MessageDirection;
}

// Conteúdo trafegado no payload MQTT (JSON publicado no tópico)
export interface MqttPayload {
  clientId: string;
  sender: string;
  body: string;
  sentAt: string; // ISO 8601
}

export interface MqttConnectConfig {
  host: string;
  port: number;
  useSsl: boolean;
  clientId: string;
}

export interface AppError {
  code:
    | 'CONNECTION_FAILED'
    | 'TOPIC_ALREADY_EXISTS'
    | 'INVALID_INPUT';
  message: string;
}
// AppError é lançado como um Error que carrega `code` e `message`, para os
// testes verificarem `err.code`:
//   Object.assign(new Error(message), { code });
```

## 2. Contrato: `SettingsRepository` — `src/repositories/settingsRepository.ts`

```ts
export interface SettingsRepository {
  // Retorna as configurações salvas ou null se ainda não existem.
  get(): Promise<Settings | null>;

  // Cria ou atualiza a linha única de settings. Gera client_id na primeira vez.
  // Retorna o estado final salvo.
  save(input: UpdateSettingsInput): Promise<Settings>;
}
```

**Regra de merge:** `save` mescla o `input` com o estado atual. Na **primeira
gravação**, os campos de broker ausentes (`brokerHost`, `brokerPort`, `useSsl`)
assumem os valores de `DEFAULT_BROKER` do `src/config.ts`; o `clientId` é gerado
(UUID). Nas gravações seguintes, mantém o `clientId` e só altera os campos
informados.

**Erros:** `save` lança `AppError INVALID_INPUT` se `nickname`, `brokerHost`
ou `brokerPort` ficarem vazios/zerados após o merge.

## 3. Contrato: `ConversationRepository` — `src/repositories/conversationRepository.ts`

```ts
export interface ConversationRepository {
  // Gera id (UUID) e createdAt internamente. Lança TOPIC_ALREADY_EXISTS
  // se o topic já existir (RN02).
  create(input: CreateConversationInput): Promise<Conversation>;

  // Retorna todas as conversas ordenadas por created_at DESC.
  findAll(): Promise<Conversation[]>;

  // Retorna a conversa ou null.
  findById(id: string): Promise<Conversation | null>;

  // Retorna a conversa pelo tópico ou null (usado ao rotear mensagem recebida).
  findByTopic(topic: string): Promise<Conversation | null>;

  // Remove a conversa; mensagens caem por cascata (RN06).
  delete(id: string): Promise<void>;
}
```

## 4. Contrato: `MessageRepository` — `src/repositories/messageRepository.ts`

```ts
export interface MessageRepository {
  // Gera id e createdAt internamente.
  create(input: CreateMessageInput): Promise<Message>;

  // Retorna as mensagens da conversa ordenadas por created_at ASC (mais antiga primeiro).
  findByConversation(conversationId: string): Promise<Message[]>;

  // (v1.1) Apaga todas as mensagens da conversa, mantendo a conversa. RN10.
  deleteByConversation(conversationId: string): Promise<void>;
}
```

## 5. Contrato: `MqttService` — `src/services/mqttService.ts`

```ts
export interface MqttService {
  // Abre a ÚNICA conexão. Monta a URL ws(s)://host:port/mqtt.
  // Reconexão automática fica a cargo do cliente mqtt (reconnectPeriod).
  // Lança AppError CONNECTION_FAILED se a conexão inicial falhar.
  connect(config: MqttConnectConfig): Promise<void>;

  // Encerra a conexão.
  disconnect(): void;

  // Assina o tópico de uma conversa na conexão existente.
  subscribe(topic: string): void;

  // Cancela a assinatura de um tópico.
  unsubscribe(topic: string): void;

  // Publica um payload (serializado em JSON) no tópico.
  publish(topic: string, payload: MqttPayload): void;

  // Registra callback para toda mensagem recebida. Retorna função de cancelamento.
  onMessage(cb: (topic: string, payload: MqttPayload) => void): () => void;

  // Status atual da conexão.
  getStatus(): ConnectionStatus;

  // Registra callback para mudança de status. Retorna função de cancelamento.
  onStatusChange(cb: (status: ConnectionStatus) => void): () => void;
}
```

**Regras de contrato do MqttService:**
- Há **uma só** instância de cliente. `connect` chamado novamente reaproveita ou
  recria a conexão, nunca acumula conexões.
- `publish` serializa o `MqttPayload` com `JSON.stringify`.
- `onMessage` entrega o payload já desserializado; payloads inválidos são ignorados.
- O `MqttService` é **apenas transporte**: `onMessage` entrega **todas** as
  mensagens do tópico, inclusive o eco da própria mensagem. O **descarte do eco**
  (quando `payload.clientId` é igual ao `clientId` do próprio app — RN04) é
  responsabilidade do **consumidor** (`useMqtt`), nunca do `MqttService`.
- A Promise de `connect` resolve no primeiro evento `connect` e rejeita com
  `CONNECTION_FAILED` se ocorrer `error` antes de conectar. Reconexões posteriores
  afetam apenas o status (via `onStatusChange`), não a Promise já resolvida.
- `connect` **nunca lança exceção síncrona** para quem chama: mesmo um host
  malformado (ex.: `wss://` inválido) é tratado dentro do método e vira uma Promise
  **rejeitada** com `CONNECTION_FAILED` (envolver a criação do cliente em try/catch).
  Quem chama (`useMqtt`) **deve capturar** a rejeição e apenas refletir status
  `error` — nunca deixar o erro subir e derrubar o app (RNF07).

## 6. Exemplo real de payload trafegado

Publicado no tópico `sala/futebol`:

```json
{
  "clientId": "a3f1c9e2-7b40-4d11-9c2a-6e5f0b8d1234",
  "sender": "Rafael",
  "body": "Alguém viu o jogo ontem?",
  "sentAt": "2026-06-03T14:22:05.123Z"
}
```

## 7. Pedido para o Agente Designer de API
Documente o contrato completo e destaque pontos ambíguos que precisam de
validação antes do desenvolvimento.
