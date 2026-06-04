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
  createdAt: string;
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
  createdAt: string;
}

export interface CreateMessageInput {
  conversationId: string;
  sender: string;
  body: string;
  direction: MessageDirection;
}

export interface MqttPayload {
  clientId: string;
  sender: string;
  body: string;
  sentAt: string;
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
