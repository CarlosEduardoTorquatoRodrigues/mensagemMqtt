import mqtt, { MqttClient } from 'mqtt';
import {
  AppError,
  ConnectionStatus,
  MqttConnectConfig,
  MqttPayload,
} from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code });
}

let client: MqttClient | null = null;
let status: ConnectionStatus = 'disconnected';
let currentConfig: MqttConnectConfig | null = null;
const statusListeners = new Set<(status: ConnectionStatus) => void>();
const messageListeners = new Set<(topic: string, payload: MqttPayload) => void>();

function updateStatus(next: ConnectionStatus): void {
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

function handleIncomingMessage(topic: string, payload: Buffer): void {
  try {
    const parsed = JSON.parse(payload.toString()) as MqttPayload;
    messageListeners.forEach((listener) => listener(topic, parsed));
  } catch {
    // Ignorar payload inválido.
  }
}

function attachClientEvents(instance: MqttClient): void {
  instance.on('message', handleIncomingMessage);
  instance.on('connect', () => updateStatus('connected'));
  instance.on('reconnect', () => updateStatus('connecting'));
  instance.on('close', () => updateStatus('disconnected'));
  instance.on('error', () => updateStatus('error'));
}

export interface MqttService {
  connect(config: MqttConnectConfig): Promise<void>;
  disconnect(): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, payload: MqttPayload): void;
  onMessage(cb: (topic: string, payload: MqttPayload) => void): () => void;
  getStatus(): ConnectionStatus;
  onStatusChange(cb: (status: ConnectionStatus) => void): () => void;
}

export const mqttService: MqttService = {
  async connect(config: MqttConnectConfig): Promise<void> {
    if (
      client &&
      currentConfig &&
      currentConfig.host === config.host &&
      currentConfig.port === config.port &&
      currentConfig.useSsl === config.useSsl &&
      currentConfig.clientId === config.clientId
    ) {
      if (status === 'connected') {
        return;
      }
    }

    if (client) {
      client.end(true);
      client = null;
      currentConfig = null;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const protocol = config.useSsl ? 'wss' : 'ws';
        const url = `${protocol}://${config.host}:${config.port}/mqtt`;
        const nextClient = mqtt.connect(url, {
          clientId: config.clientId,
          reconnectPeriod: 5000,
        });

        let settled = false;
        let hasConnected = false;

        nextClient.on('connect', () => {
          hasConnected = true;
          updateStatus('connected');
          if (!settled) {
            settled = true;
            resolve();
          }
        });

        nextClient.on('reconnect', () => {
          updateStatus('connecting');
        });

        nextClient.on('close', () => {
          updateStatus('disconnected');
        });

        nextClient.on('error', () => {
          updateStatus('error');
          if (!hasConnected && !settled) {
            settled = true;
            reject(createAppError('CONNECTION_FAILED', 'Falha ao conectar ao broker')); 
          }
        });

        nextClient.on('message', handleIncomingMessage);

        client = nextClient;
        currentConfig = config;
        updateStatus('connecting');
      } catch {
        reject(createAppError('CONNECTION_FAILED', 'Falha ao conectar ao broker'));
      }
    });
  },

  disconnect(): void {
    if (client) {
      client.end(true);
      client = null;
      currentConfig = null;
    }
    updateStatus('disconnected');
  },

  subscribe(topic: string): void {
    client?.subscribe(topic);
  },

  unsubscribe(topic: string): void {
    client?.unsubscribe(topic);
  },

  publish(topic: string, payload: MqttPayload): void {
    client?.publish(topic, JSON.stringify(payload));
  },

  onMessage(cb: (topic: string, payload: MqttPayload) => void): () => void {
    messageListeners.add(cb);
    return () => {
      messageListeners.delete(cb);
    };
  },

  getStatus(): ConnectionStatus {
    return status;
  },

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    statusListeners.add(cb);
    return () => {
      statusListeners.delete(cb);
    };
  },
};
